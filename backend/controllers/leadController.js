import prisma from '../services/db.js';
import { calculateScore } from '../services/scoringEngine.js';
import { assignLead } from '../services/assignmentEngine.js';
import { generateLeadAdvice } from '../services/aiService.js';

/**
 * Get all leads with pagination, search, and filtering
 */
export async function getAllLeads(req, res) {
  const { status, source, temperature, search, page = 1, limit = 10 } = req.query;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;

  // Build prisma filter object
  const where = {};

  if (status) {
    where.status = status;
  }
  if (source) {
    where.source = source;
  }
  if (temperature) {
    where.score = {
      temperature: temperature
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { companyName: { contains: search } },
      { email: { contains: search } },
      { industry: { contains: search } }
    ];
  }

  // Enforce RBAC: Sales Reps can only view leads assigned to them (unless they are ADMIN/PM/TECH_LEAD)
  if (req.user.role === 'SALES_REP') {
    where.assignment = {
      assignedToId: req.user.id
    };
  }

  try {
    const total = await prisma.lead.count({ where });
    const leads = await prisma.lead.findMany({
      where,
      include: {
        score: true,
        assignment: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        checklist: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parsedLimit,
    });

    return res.json({
      leads,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ error: 'Server error fetching leads.' });
  }
}

/**
 * Get single lead by ID with complete details and AI suggestions
 */
export async function getLeadById(req, res) {
  const { id } = req.params;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        score: true,
        assignment: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        checklist: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        assignmentHistory: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        communicationLogs: { orderBy: { createdAt: 'desc' } },
        activityLogs: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // RBAC: Check if Sales Rep is authorized to view this lead
    if (req.user.role === 'SALES_REP' && lead.assignment?.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this lead.' });
    }

    // Generate AI recommendations
    let aiRecommendations = null;
    if (lead.score) {
      aiRecommendations = await generateLeadAdvice(lead, lead.score);
    }

    return res.json({ lead, aiRecommendations });
  } catch (error) {
    console.error('Error fetching lead details:', error);
    return res.status(500).json({ error: 'Server error fetching lead details.' });
  }
}

/**
 * Create a new lead with automatic scoring & assignment
 */
export async function createLead(req, res) {
  const { 
    name, companyName, email, phone, industry, budget, projectSize, urgency, source, notes, industryFit = 'GOOD',
    estimatedBudget, expectedRevenue, conversionProbability 
  } = req.body;

  if (!name || !companyName || !email || !phone || !industry || !budget || !projectSize || !urgency || !source) {
    return res.status(400).json({ error: 'Please provide all required lead fields.' });
  }

  try {
    const tempLeadForScoring = { budget, projectSize, urgency, industryFit };
    const scoreData = calculateScore(tempLeadForScoring);
    
    const estBudget = estimatedBudget !== undefined ? Number(estimatedBudget) : (budget === 'HIGH' ? 500000 : budget === 'MEDIUM' ? 300000 : 100000);
    const convProb = conversionProbability !== undefined ? Number(conversionProbability) : (scoreData.score >= 80 ? 75 : scoreData.score >= 60 ? 50 : 25);
    const expRev = expectedRevenue !== undefined ? Number(expectedRevenue) : Math.round(estBudget * (convProb / 100));

    // 1. Create the lead
    const lead = await prisma.lead.create({
      data: {
        name,
        companyName,
        email,
        phone,
        industry,
        budget,
        projectSize,
        urgency,
        source,
        notes,
        industryFit,
        status: 'NEW',
        estimatedBudget: estBudget,
        expectedRevenue: expRev,
        conversionProbability: convProb
      }
    });

    // 2. Score the lead
    const scoreRecord = await prisma.leadScore.create({
      data: {
        leadId: lead.id,
        score: scoreData.score,
        temperature: scoreData.temperature,
        budgetScore: scoreData.budgetScore,
        projectSizeScore: scoreData.projectSizeScore,
        urgencyScore: scoreData.urgencyScore,
        industryFitScore: scoreData.industryFitScore,
      }
    });

    // 3. Assign the lead automatically
    const assignmentResult = await assignLead(lead, scoreData.temperature, prisma);
    const assignmentRecord = await prisma.assignment.create({
      data: {
        leadId: lead.id,
        assignedToId: assignmentResult.assignedToId,
        notes: assignmentResult.notes,
      }
    });

    // 4. Create empty checklist
    const checklistRecord = await prisma.checklist.create({
      data: {
        leadId: lead.id,
        budgetConfirmed: false,
        decisionMakerIdentified: false,
        timelineConfirmed: false,
        requirementsCollected: false,
        proposalSent: false,
        progress: 0,
      }
    });

    // 5. Create activity log & status history
    await prisma.statusHistory.create({
      data: {
        leadId: lead.id,
        oldStatus: null,
        newStatus: 'NEW',
        changedBy: req.user ? req.user.name : 'System'
      }
    });

    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        userId: req.user ? req.user.id : null,
        action: 'LEAD_CREATED',
        description: `Lead created from ${source.toLowerCase()}. Automatically scored ${scoreData.score} (${scoreData.temperature}).`,
      }
    });

    // If assigned, log assignment activity, history & trigger notification
    if (assignmentResult.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignmentResult.assignedToId },
        select: { name: true }
      });

      await prisma.assignmentHistory.create({
        data: {
          leadId: lead.id,
          assignedTo: assignedUser?.name || 'Sales Representative',
          assignedBy: 'System',
          notes: assignmentResult.notes || 'Automatically assigned.'
        }
      });

      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          userId: req.user ? req.user.id : null,
          action: 'LEAD_ASSIGNED',
          description: `Automatically assigned to ${assignedUser?.name || 'Sales Representative'}.`,
        }
      });

      await prisma.notification.create({
        data: {
          userId: assignmentResult.assignedToId,
          title: 'New Lead Assignment',
          message: `You have been assigned: ${lead.name} (${lead.companyName}). Score: ${scoreData.score}`,
          type: 'LEAD_ASSIGNED',
        }
      });
    }

    return res.status(201).json({
      message: 'Lead created successfully',
      leadId: lead.id,
      score: scoreRecord.score,
      temperature: scoreRecord.temperature,
      assignedTo: assignmentResult.assignedToId,
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ error: 'Server error creating lead.' });
  }
}

/**
 * Update lead (including checklists, status, and manual assignment override)
 */
export async function updateLead(req, res) {
  const { id } = req.params;
  const {
    name, companyName, email, phone, industry, budget, projectSize, urgency, source, notes, status, industryFit,
    estimatedBudget, expectedRevenue, conversionProbability,
    // Assignment
    assignedToId, assignmentNotes,
    // Checklist
    budgetConfirmed, decisionMakerIdentified, timelineConfirmed, requirementsCollected, proposalSent
  } = req.body;

  try {
    const existingLead = await prisma.lead.findUnique({
      where: { id },
      include: { score: true, assignment: true, checklist: true }
    });

    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // RBAC: Sales Reps can only update leads assigned to them
    if (req.user.role === 'SALES_REP' && existingLead.assignment?.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this lead.' });
    }

    // 1. Check if score needs recalculation
    const scoreFieldsChanged = (
      (budget && budget !== existingLead.budget) ||
      (projectSize && projectSize !== existingLead.projectSize) ||
      (urgency && urgency !== existingLead.urgency) ||
      (industryFit && industryFit !== existingLead.industryFit)
    );

    // Compute updated estimated budget, probability and expected revenue if modified
    const updatedEstBudget = estimatedBudget !== undefined ? Number(estimatedBudget) : existingLead.estimatedBudget;
    const updatedConvProb = conversionProbability !== undefined ? Number(conversionProbability) : existingLead.conversionProbability;
    const updatedExpRev = expectedRevenue !== undefined ? Number(expectedRevenue) : Math.round(updatedEstBudget * (updatedConvProb / 100));

    // 2. Update Lead Table
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        name: name || existingLead.name,
        companyName: companyName || existingLead.companyName,
        email: email || existingLead.email,
        phone: phone || existingLead.phone,
        industry: industry || existingLead.industry,
        budget: budget || existingLead.budget,
        projectSize: projectSize || existingLead.projectSize,
        urgency: urgency || existingLead.urgency,
        source: source || existingLead.source,
        notes: notes !== undefined ? notes : existingLead.notes,
        status: status || existingLead.status,
        industryFit: industryFit || existingLead.industryFit,
        estimatedBudget: updatedEstBudget,
        conversionProbability: updatedConvProb,
        expectedRevenue: updatedExpRev
      }
    });

    // 3. Recalculate score if needed
    let newScoreRecord = existingLead.score;
    if (scoreFieldsChanged) {
      const scoreData = calculateScore(updatedLead);
      newScoreRecord = await prisma.leadScore.update({
        where: { leadId: id },
        data: {
          score: scoreData.score,
          temperature: scoreData.temperature,
          budgetScore: scoreData.budgetScore,
          projectSizeScore: scoreData.projectSizeScore,
          urgencyScore: scoreData.urgencyScore,
          industryFitScore: scoreData.industryFitScore,
        }
      });

      await prisma.activityLog.create({
        data: {
          leadId: id,
          userId: req.user.id,
          action: 'SCORE_RECALCULATED',
          description: `Lead details updated. Recalculated score: ${scoreData.score} (${scoreData.temperature}).`,
        }
      });
    }

    // 4. Update Checklist if checklist items are provided
    let newChecklistRecord = existingLead.checklist;
    const hasChecklistUpdates = (
      budgetConfirmed !== undefined ||
      decisionMakerIdentified !== undefined ||
      timelineConfirmed !== undefined ||
      requirementsCollected !== undefined ||
      proposalSent !== undefined
    );

    if (hasChecklistUpdates) {
      const bConf = budgetConfirmed !== undefined ? budgetConfirmed : (existingLead.checklist?.budgetConfirmed || false);
      const dDec = decisionMakerIdentified !== undefined ? decisionMakerIdentified : (existingLead.checklist?.decisionMakerIdentified || false);
      const tTime = timelineConfirmed !== undefined ? timelineConfirmed : (existingLead.checklist?.timelineConfirmed || false);
      const rReq = requirementsCollected !== undefined ? requirementsCollected : (existingLead.checklist?.requirementsCollected || false);
      const pProp = proposalSent !== undefined ? proposalSent : (existingLead.checklist?.proposalSent || false);

      let completedCount = 0;
      if (bConf) completedCount++;
      if (dDec) completedCount++;
      if (tTime) completedCount++;
      if (rReq) completedCount++;
      if (pProp) completedCount++;
      const progress = completedCount * 20;

      newChecklistRecord = await prisma.checklist.update({
        where: { leadId: id },
        data: {
          budgetConfirmed: bConf,
          decisionMakerIdentified: dDec,
          timelineConfirmed: tTime,
          requirementsCollected: rReq,
          proposalSent: pProp,
          progress,
        }
      });

      await prisma.activityLog.create({
        data: {
          leadId: id,
          userId: req.user.id,
          action: 'CHECKLIST_UPDATED',
          description: `Checklist items modified. New progress: ${progress}%.`,
        }
      });

      // Notification if Qualification completed (100%)
      if (progress === 100 && existingLead.checklist?.progress !== 100) {
        // Find Admins & current assigned user to notify
        const assignToId = existingLead.assignment?.assignedToId;
        const usersToNotify = await prisma.user.findMany({
          where: {
            OR: [
              { role: 'ADMIN' },
              { id: assignToId || '' }
            ]
          }
        });

        for (const user of usersToNotify) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Qualification Completed',
              message: `Lead ${updatedLead.name} (${updatedLead.companyName}) has completed 100% of the qualification checklist!`,
              type: 'CHECKLIST_COMPLETED',
            }
          });
        }
      }
    }

    // 5. Handle Manual Assignment Override (Managers/Admins only)
    if (assignedToId !== undefined && assignedToId !== existingLead.assignment?.assignedToId) {
      if (req.user.role === 'SALES_REP') {
        return res.status(403).json({ error: 'Forbidden: Sales Representatives cannot reassign leads.' });
      }

      let assignedUser = null;
      if (assignedToId) {
        assignedUser = await prisma.user.findUnique({ where: { id: assignedToId } });
        if (!assignedUser) {
          return res.status(400).json({ error: 'Assigned representative user not found.' });
        }
      }

      await prisma.assignment.update({
        where: { leadId: id },
        data: {
          assignedToId: assignedToId || null,
          notes: assignmentNotes || `Manually reassigned by ${req.user.name}.`,
          assignedDate: new Date(),
        }
      });

      await prisma.assignmentHistory.create({
        data: {
          leadId: id,
          assignedTo: assignedUser ? assignedUser.name : 'Unassigned',
          assignedBy: req.user.name || 'System',
          notes: assignmentNotes || 'Manually reassigned.'
        }
      });

      await prisma.activityLog.create({
        data: {
          leadId: id,
          userId: req.user.id,
          action: 'LEAD_REASSIGNED',
          description: assignedUser
            ? `Manually reassigned to ${assignedUser.name} by ${req.user.name}.`
            : `Lead assignment removed by ${req.user.name}.`,
        }
      });

      // Notify the new representative
      if (assignedToId) {
        await prisma.notification.create({
          data: {
            userId: assignedToId,
            title: 'Lead Assigned to You',
            message: `Lead: ${updatedLead.name} (${updatedLead.companyName}) was manually assigned to you by ${req.user.name}.`,
            type: 'LEAD_ASSIGNED',
          }
        });
      }
    }

    // 6. Handle Status Changes activity logs & notifications
    if (status && status !== existingLead.status) {
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          oldStatus: existingLead.status,
          newStatus: status,
          changedBy: req.user.name || 'System'
        }
      });

      await prisma.activityLog.create({
        data: {
          leadId: id,
          userId: req.user.id,
          action: 'STATUS_UPDATED',
          description: `Status updated from "${existingLead.status}" to "${status}" by ${req.user.name}.`,
        }
      });

      // Notify relevant users
      const assignToId = existingLead.assignment?.assignedToId;
      const usersToNotify = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'ADMIN' },
            ...(assignToId ? [{ id: assignToId }] : [])
          ]
        }
      });

      for (const u of usersToNotify) {
        // Don't notify the user who made the change
        if (u.id === req.user.id) continue;

        await prisma.notification.create({
          data: {
            userId: u.id,
            title: 'Lead Status Updated',
            message: `Lead ${updatedLead.name} (${updatedLead.companyName}) status updated to: ${status}`,
            type: 'STATUS_UPDATED',
          }
        });
      }
    }

    return res.json({
      message: 'Lead updated successfully',
      lead: updatedLead,
      score: newScoreRecord,
      checklist: newChecklistRecord
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ error: 'Server error updating lead.' });
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(req, res) {
  const { id } = req.params;

  // RBAC: Admins only
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Only administrators can delete leads.' });
  }

  try {
    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    await prisma.lead.delete({ where: { id } });
    return res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return res.status(500).json({ error: 'Server error deleting lead.' });
  }
}

/**
 * Log a new communication
 */
export async function logCommunication(req, res) {
  const { id } = req.params;
  const { type, subject, body } = req.body;

  if (!type || !subject || !body) {
    return res.status(400).json({ error: 'Please provide type, subject, and body.' });
  }

  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const log = await prisma.communicationLog.create({
      data: {
        leadId: id,
        type,
        subject,
        body,
        loggedBy: req.user.name || 'System'
      }
    });

    await prisma.activityLog.create({
      data: {
        leadId: id,
        userId: req.user.id,
        action: 'COMMUNICATION_LOGGED',
        description: `Logged a ${type.toLowerCase()} communication: "${subject}"`
      }
    });

    return res.status(201).json({ message: 'Communication logged successfully.', log });
  } catch (error) {
    console.error('Error logging communication:', error);
    return res.status(500).json({ error: 'Server error logging communication.' });
  }
}

/**
 * Add a new document
 */
export async function addDocument(req, res) {
  const { id } = req.params;
  const { name, fileSize, fileType } = req.body;

  if (!name || !fileSize || !fileType) {
    return res.status(400).json({ error: 'Please provide document name, size, and type.' });
  }

  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const doc = await prisma.document.create({
      data: {
        leadId: id,
        name,
        fileSize,
        fileType,
        uploadedBy: req.user.name || 'System'
      }
    });

    await prisma.activityLog.create({
      data: {
        leadId: id,
        userId: req.user.id,
        action: 'DOCUMENT_UPLOADED',
        description: `Attached document: "${name}"`
      }
    });

    return res.status(201).json({ message: 'Document added successfully.', doc });
  } catch (error) {
    console.error('Error adding document:', error);
    return res.status(500).json({ error: 'Server error adding document.' });
  }
}
