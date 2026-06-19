import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.checklist.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.leadScore.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding roles & users...');
  
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const salesPassword = await bcrypt.hash('sales123', salt);
  const pmPassword = await bcrypt.hash('pm123', salt);
  const techPassword = await bcrypt.hash('tech123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Arthur Admin',
      email: 'admin@crownridge.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const salesRep1 = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'rahul.verma@crownridge.com',
      password: salesPassword,
      role: 'SALES_REP',
    },
  });

  const salesRep2 = await prisma.user.create({
    data: {
      name: 'Ananya Reddy',
      email: 'ananya.reddy@crownridge.com',
      password: salesPassword,
      role: 'SALES_REP',
    },
  });

  const pm = await prisma.user.create({
    data: {
      name: 'Vikram Singh',
      email: 'vikram.singh@crownridge.com',
      password: pmPassword,
      role: 'PROJECT_MANAGER',
    },
  });

  const techLead = await prisma.user.create({
    data: {
      name: 'Kiran Kumar',
      email: 'kiran.kumar@crownridge.com',
      password: techPassword,
      role: 'TECH_LEAD',
    },
  });

  console.log('Users created successfully:', {
    admin: admin.email,
    salesRep1: salesRep1.email,
    salesRep2: salesRep2.email,
    pm: pm.email,
    techLead: techLead.email,
  });

  // 20 Leads data
  const leadsData = [
    {
      name: 'Rakesh Kumar',
      companyName: 'TechNova Solutions',
      email: 'rakesh@technova.in',
      phone: '+91 98765 43200',
      industry: 'Technology',
      budget: 'HIGH',
      projectSize: 'LARGE',
      urgency: 'HIGH',
      source: 'WEBSITE',
      industryFit: 'EXCELLENT',
      notes: 'TechNova Solutions requires full-stack enterprise cloud migration and DevOps automation architecture guidelines.',
      status: 'CONTACTED',
      estimatedBudget: 800000,
      conversionProbability: 75,
      expectedRevenue: 600000,
      temp: 'HOT',
      assignedTo: 'Rahul'
    },
    {
      name: 'Priya Sharma',
      companyName: 'FinEdge Pvt Ltd',
      email: 'priya@finedge.in',
      phone: '+91 98765 43201',
      industry: 'Finance',
      budget: 'HIGH',
      projectSize: 'MEDIUM',
      urgency: 'MEDIUM',
      source: 'LINKEDIN',
      industryFit: 'EXCELLENT',
      notes: 'FinEdge is seeking core microservices API consulting to improve high-frequency trading latency profiles.',
      status: 'PROPOSAL_SENT',
      estimatedBudget: 600000,
      conversionProbability: 70,
      expectedRevenue: 420000,
      temp: 'HOT',
      assignedTo: 'Ananya'
    },
    {
      name: 'Arjun Reddy',
      companyName: 'MedCare Systems',
      email: 'arjun@medcare.in',
      phone: '+91 98765 43202',
      industry: 'Healthcare',
      budget: 'MEDIUM',
      projectSize: 'SMALL',
      urgency: 'MEDIUM',
      source: 'REFERRAL',
      industryFit: 'GOOD',
      notes: 'Initial clinical data catalog management software consultation. Compliant local servers hosting required.',
      status: 'QUALIFIED',
      estimatedBudget: 400000,
      conversionProbability: 50,
      expectedRevenue: 200000,
      temp: 'WARM',
      assignedTo: 'Rahul'
    },
    {
      name: 'Karthik Rao',
      companyName: 'RetailX India',
      email: 'karthik@retailx.in',
      phone: '+91 98765 43203',
      industry: 'Retail',
      budget: 'LOW',
      projectSize: 'SMALL',
      urgency: 'LOW',
      source: 'WEBSITE',
      industryFit: 'POOR',
      notes: 'Small-scale web portal optimization project. Limited resources.',
      status: 'NEW',
      estimatedBudget: 150000,
      conversionProbability: 15,
      expectedRevenue: 22500,
      temp: 'COLD',
      assignedTo: null
    },
    {
      name: 'Sneha Verma',
      companyName: 'LogiFlow Technologies',
      email: 'sneha@logiflow.in',
      phone: '+91 98765 43204',
      industry: 'Logistics',
      budget: 'MEDIUM',
      projectSize: 'SMALL',
      urgency: 'MEDIUM',
      source: 'LINKEDIN',
      industryFit: 'GOOD',
      notes: 'Route map tracking dashboard integration scoping. Basic map APIs integration.',
      status: 'CONTACTED',
      estimatedBudget: 350000,
      conversionProbability: 45,
      expectedRevenue: 157500,
      temp: 'WARM',
      assignedTo: 'Ananya'
    },
    {
      name: 'Amit Patel',
      companyName: 'Apex Digital',
      email: 'amit@apexdigital.in',
      phone: '+91 98765 43205',
      industry: 'Logistics',
      budget: 'LOW',
      projectSize: 'SMALL',
      urgency: 'LOW',
      source: 'REFERRAL',
      industryFit: 'POOR',
      notes: 'Shopify basic store deployment and analytics connection inquiry.',
      status: 'NEW',
      estimatedBudget: 100000,
      conversionProbability: 10,
      expectedRevenue: 10000,
      temp: 'COLD',
      assignedTo: null
    },
    {
      name: 'Deepika Sen',
      companyName: 'Tata Consult',
      email: 'deepika@tataconsult.in',
      phone: '+91 98765 43206',
      industry: 'Technology',
      budget: 'HIGH',
      projectSize: 'LARGE',
      urgency: 'HIGH',
      source: 'WEBSITE',
      industryFit: 'EXCELLENT',
      notes: 'Comprehensive multi-tenant SaaS application migration guidelines approved and won.',
      status: 'WON',
      estimatedBudget: 1200000,
      conversionProbability: 100,
      expectedRevenue: 1200000,
      temp: 'HOT',
      assignedTo: null
    },
    {
      name: 'Vinay Nair',
      companyName: 'Wipro Health',
      email: 'vinay@wiprohealth.in',
      phone: '+91 98765 43207',
      industry: 'Healthcare',
      budget: 'HIGH',
      projectSize: 'LARGE',
      urgency: 'HIGH',
      source: 'WEBSITE',
      industryFit: 'EXCELLENT',
      notes: 'Successfully closed hospital telemetry routing software consulting.',
      status: 'WON',
      estimatedBudget: 1500000,
      conversionProbability: 100,
      expectedRevenue: 1500000,
      temp: 'HOT',
      assignedTo: null
    },
    {
      name: 'Sunil Mehta',
      companyName: 'Infosys Retail',
      email: 'sunil@infosysretail.in',
      phone: '+91 98765 43208',
      industry: 'Retail',
      budget: 'HIGH',
      projectSize: 'LARGE',
      urgency: 'HIGH',
      source: 'REFERRAL',
      industryFit: 'EXCELLENT',
      notes: 'Omnichannel inventory sync engine pipeline won and finalized.',
      status: 'WON',
      estimatedBudget: 1000000,
      conversionProbability: 100,
      expectedRevenue: 1000000,
      temp: 'HOT',
      assignedTo: null
    },
    {
      name: 'Pooja Gupta',
      companyName: 'HDFC Services',
      email: 'pooja@hdfcservices.in',
      phone: '+91 98765 43209',
      industry: 'Finance',
      budget: 'HIGH',
      projectSize: 'MEDIUM',
      urgency: 'MEDIUM',
      source: 'LINKEDIN',
      industryFit: 'EXCELLENT',
      notes: 'Economic recession forced project delay. Archived as lost.',
      status: 'LOST',
      estimatedBudget: 500000,
      conversionProbability: 0,
      expectedRevenue: 0,
      temp: 'HOT',
      assignedTo: null
    },
    {
      name: 'Sanjay Dutt',
      companyName: 'Reliance Industries',
      email: 'sanjay@reliance.in',
      phone: '+91 98765 43210',
      industry: 'Technology',
      budget: 'HIGH',
      projectSize: 'MEDIUM',
      urgency: 'MEDIUM',
      source: 'WEBSITE',
      industryFit: 'EXCELLENT',
      notes: 'Alternative vendor selected due to lower pre-sales cost models.',
      status: 'LOST',
      estimatedBudget: 750000,
      conversionProbability: 0,
      expectedRevenue: 0,
      temp: 'HOT',
      assignedTo: null
    },
    {
      name: 'Rohit Sharma',
      companyName: 'Jio Platforms',
      email: 'rohit@jio.in',
      phone: '+91 98765 43211',
      industry: 'Technology',
      budget: 'HIGH',
      projectSize: 'LARGE',
      urgency: 'HIGH',
      source: 'WEBSITE',
      industryFit: 'EXCELLENT',
      notes: '5G network analytics routing dashboard proposal under review.',
      status: 'NEGOTIATION',
      estimatedBudget: 900000,
      conversionProbability: 80,
      expectedRevenue: 720000,
      temp: 'HOT',
      assignedTo: 'Rahul'
    },
    {
      name: 'MS Dhoni',
      companyName: 'Chennai Super',
      email: 'dhoni@chennaisuper.in',
      phone: '+91 98765 43212',
      industry: 'Logistics',
      budget: 'MEDIUM',
      projectSize: 'SMALL',
      urgency: 'HIGH',
      source: 'LINKEDIN',
      industryFit: 'POOR',
      notes: 'Route allocation metrics tracking app negotiation.',
      status: 'NEGOTIATION',
      estimatedBudget: 500000,
      conversionProbability: 60,
      expectedRevenue: 300000,
      temp: 'WARM',
      assignedTo: 'Rahul'
    },
    {
      name: 'Sachin Tendulkar',
      companyName: 'Master Blaster',
      email: 'sachin@masterblaster.in',
      phone: '+91 98765 43213',
      industry: 'Finance',
      budget: 'MEDIUM',
      projectSize: 'SMALL',
      urgency: 'MEDIUM',
      source: 'REFERRAL',
      industryFit: 'GOOD',
      notes: 'Scoping custom accounting integrations.',
      status: 'QUALIFIED',
      estimatedBudget: 450000,
      conversionProbability: 55,
      expectedRevenue: 247500,
      temp: 'WARM',
      assignedTo: 'Ananya'
    },
    {
      name: 'Jasprit Bumrah',
      companyName: 'Mumbai Indians',
      email: 'jasprit@mumbaiindians.in',
      phone: '+91 98765 43214',
      industry: 'Technology',
      budget: 'MEDIUM',
      projectSize: 'SMALL',
      urgency: 'MEDIUM',
      source: 'WEBSITE',
      industryFit: 'GOOD',
      notes: 'Consulting on AI-driven player metrics dashboard templates.',
      status: 'CONTACTED',
      estimatedBudget: 400000,
      conversionProbability: 40,
      expectedRevenue: 160000,
      temp: 'WARM',
      assignedTo: null
    },
    {
      name: 'Virat Kohli',
      companyName: 'Royal Challengers',
      email: 'virat@royalchallengers.in',
      phone: '+91 98765 43215',
      industry: 'Retail',
      budget: 'MEDIUM',
      projectSize: 'SMALL',
      urgency: 'MEDIUM',
      source: 'LINKEDIN',
      industryFit: 'GOOD',
      notes: 'Initial pitch delivered for inventory sync. SOW drafted.',
      status: 'PROPOSAL_SENT',
      estimatedBudget: 350000,
      conversionProbability: 65,
      expectedRevenue: 227500,
      temp: 'WARM',
      assignedTo: null
    },
    {
      name: 'Rishabh Pant',
      companyName: 'Delhi Capitals',
      email: 'rishabh@delhicapitals.in',
      phone: '+91 98765 43216',
      industry: 'Healthcare',
      budget: 'LOW',
      projectSize: 'SMALL',
      urgency: 'LOW',
      source: 'WEBSITE',
      industryFit: 'POOR',
      notes: 'Clinic scheduling module mock-up request.',
      status: 'NEW',
      estimatedBudget: 120000,
      conversionProbability: 12,
      expectedRevenue: 14400,
      temp: 'COLD',
      assignedTo: null
    },
    {
      name: 'Shreya Ghoshal',
      companyName: 'Melody Music',
      email: 'shreya@melodymusic.in',
      phone: '+91 98765 43217',
      industry: 'Retail',
      budget: 'LOW',
      projectSize: 'SMALL',
      urgency: 'LOW',
      source: 'WEBSITE',
      industryFit: 'POOR',
      notes: 'Consulting on simple static website portfolio.',
      status: 'NEW',
      estimatedBudget: 90000,
      conversionProbability: 8,
      expectedRevenue: 7200,
      temp: 'COLD',
      assignedTo: null
    },
    {
      name: 'A.R. Rahman',
      companyName: 'Panchathan Studios',
      email: 'rahman@panchathan.in',
      phone: '+91 98765 43218',
      industry: 'Technology',
      budget: 'LOW',
      projectSize: 'SMALL',
      urgency: 'LOW',
      source: 'WEBSITE',
      industryFit: 'POOR',
      notes: 'Audio catalog metadata scraping tool query.',
      status: 'NEW',
      estimatedBudget: 200000,
      conversionProbability: 20,
      expectedRevenue: 40000,
      temp: 'COLD',
      assignedTo: null
    },
    {
      name: 'Neha Kakkar',
      companyName: 'Bollywood Beats',
      email: 'neha@bollywoodbeats.in',
      phone: '+91 98765 43219',
      industry: 'Logistics',
      budget: 'LOW',
      projectSize: 'SMALL',
      urgency: 'LOW',
      source: 'WEBSITE',
      industryFit: 'POOR',
      notes: 'Simple delivery tracker layout.',
      status: 'NEW',
      estimatedBudget: 80000,
      conversionProbability: 5,
      expectedRevenue: 4000,
      temp: 'COLD',
      assignedTo: null
    }
  ];

  console.log('Seeding leads, scores, assignments, and checklists...');

  for (const leadInput of leadsData) {
    const { temp, assignedTo, ...cleanInput } = leadInput;
    
    // 1. Create Lead
    const lead = await prisma.lead.create({
      data: cleanInput,
    });

    // 2. Score Lead
    let budgetScore = 10;
    if (lead.budget === 'MEDIUM') budgetScore = 20;
    if (lead.budget === 'HIGH') budgetScore = 30;

    let projectSizeScore = 10;
    if (lead.projectSize === 'MEDIUM') projectSizeScore = 20;
    if (lead.projectSize === 'LARGE') projectSizeScore = 30;

    let urgencyScore = 5;
    if (lead.urgency === 'MEDIUM') urgencyScore = 10;
    if (lead.urgency === 'HIGH') urgencyScore = 20;

    let industryFitScore = 5;
    if (lead.industryFit === 'GOOD') industryFitScore = 15;
    if (lead.industryFit === 'EXCELLENT') industryFitScore = 20;

    const score = budgetScore + projectSizeScore + urgencyScore + industryFitScore;
    const temperature = temp;

    await prisma.leadScore.create({
      data: {
        leadId: lead.id,
        score,
        temperature,
        budgetScore,
        projectSizeScore,
        urgencyScore,
        industryFitScore,
      },
    });

    // 3. Assign Lead
    let assignedToId = null;
    let assignmentNotes = 'Initial lead ingest.';

    if (assignedTo === 'Rahul') {
      assignedToId = salesRep1.id;
      assignmentNotes = 'Assigned to Rahul Verma.';
    } else if (assignedTo === 'Ananya') {
      assignedToId = salesRep2.id;
      assignmentNotes = 'Assigned to Ananya Reddy.';
    } else if (temperature === 'COLD') {
      assignmentNotes = 'Queued for manual review (COLD Lead review).';
    } else {
      assignmentNotes = 'Ingested. Queue allocation review pending.';
    }

    await prisma.assignment.create({
      data: {
        leadId: lead.id,
        assignedToId,
        notes: assignmentNotes,
      },
    });

    // 4. Create Checklist
    let budgetConfirmed = false;
    let decisionMakerIdentified = false;
    let timelineConfirmed = false;
    let requirementsCollected = false;
    let proposalSent = false;

    if (lead.status !== 'NEW') {
      budgetConfirmed = true;
      decisionMakerIdentified = true;
    }
    if (['NEGOTIATION', 'WON'].includes(lead.status)) {
      timelineConfirmed = true;
      requirementsCollected = true;
      proposalSent = true;
    }

    let completedCount = 0;
    if (budgetConfirmed) completedCount++;
    if (decisionMakerIdentified) completedCount++;
    if (timelineConfirmed) completedCount++;
    if (requirementsCollected) completedCount++;
    if (proposalSent) completedCount++;
    const progress = completedCount * 20;

    await prisma.checklist.create({
      data: {
        leadId: lead.id,
        budgetConfirmed,
        decisionMakerIdentified,
        timelineConfirmed,
        requirementsCollected,
        proposalSent,
        progress,
      },
    });

    // 5. Create Activity Logs, History, Documents & Communications with relative dates
    const baseDate = new Date();
    const leadOffsetHrs = leadsData.findIndex(l => l.email === leadInput.email) * 2;
    baseDate.setHours(baseDate.getHours() - 3 - leadOffsetHrs);

    const dateAtOffset = (mins) => {
      const d = new Date(baseDate);
      d.setMinutes(d.getMinutes() + mins);
      return d;
    };

    // Update lead's createdAt to baseDate
    await prisma.lead.update({
      where: { id: lead.id },
      data: { createdAt: baseDate }
    });

    // A. Status history ingestion
    await prisma.statusHistory.create({
      data: {
        leadId: lead.id,
        oldStatus: null,
        newStatus: 'NEW',
        changedBy: 'System',
        createdAt: baseDate
      }
    });

    // B. Lead Ingest Log
    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        userId: admin.id,
        action: 'LEAD_CREATED',
        description: `Lead created from ${lead.source.toLowerCase()}. Automatically scored ${score} (${temperature}).`,
        createdAt: baseDate
      }
    });

    // C. Assignment history
    if (assignedToId) {
      const assignedUser = assignedToId === salesRep1.id ? salesRep1 : salesRep2;
      
      await prisma.assignmentHistory.create({
        data: {
          leadId: lead.id,
          assignedTo: assignedUser.name,
          assignedBy: 'System',
          notes: assignmentNotes,
          createdAt: dateAtOffset(5)
        }
      });

      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          userId: admin.id,
          action: 'LEAD_ASSIGNED',
          description: `Automatically routed to rep ${assignedUser.name}.`,
          createdAt: dateAtOffset(5)
        }
      });

      await prisma.notification.create({
        data: {
          userId: assignedToId,
          title: 'New Lead Assigned',
          message: `You have been assigned ${lead.name} from ${lead.companyName}.`,
          type: 'LEAD_ASSIGNED',
          createdAt: dateAtOffset(5)
        }
      });
    }

    // D. Checklist logs
    if (progress > 0) {
      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          userId: assignedToId || admin.id,
          action: 'CHECKLIST_UPDATED',
          description: `Scoping checklist items ticked. Progress: ${progress}%.`,
          createdAt: dateAtOffset(20)
        }
      });
    }
    if (progress === 100) {
      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          userId: assignedToId || admin.id,
          action: 'CHECKLIST_COMPLETED',
          description: 'Qualification complete: Checklist successfully closed out.',
          createdAt: dateAtOffset(30)
        }
      });
    }

    // E. Status changes
    if (lead.status !== 'NEW') {
      await prisma.statusHistory.create({
        data: {
          leadId: lead.id,
          oldStatus: 'NEW',
          newStatus: lead.status,
          changedBy: assignedToId ? (assignedToId === salesRep1.id ? salesRep1.name : salesRep2.name) : 'System',
          createdAt: dateAtOffset(35)
        }
      });

      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          userId: assignedToId,
          action: 'STATUS_UPDATED',
          description: `Status updated from "NEW" to "${lead.status}".`,
          createdAt: dateAtOffset(35)
        }
      });
    }

    // F. Scoping documents
    if (['QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(lead.status)) {
      await prisma.document.create({
        data: {
          leadId: lead.id,
          name: `${lead.companyName.replace(/\s+/g, '_')}_SOW_Scoping.docx`,
          fileSize: '1.2 MB',
          fileType: 'DOCX',
          uploadedBy: assignedToId ? (assignedToId === salesRep1.id ? salesRep1.name : salesRep2.name) : 'System',
          createdAt: dateAtOffset(40)
        }
      });
    }

    if (['PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(lead.status)) {
      await prisma.document.create({
        data: {
          leadId: lead.id,
          name: `IT_Proposal_${lead.companyName.replace(/\s+/g, '_')}.pdf`,
          fileSize: '2.5 MB',
          fileType: 'PDF',
          uploadedBy: assignedToId ? (assignedToId === salesRep1.id ? salesRep1.name : salesRep2.name) : 'System',
          createdAt: dateAtOffset(50)
        }
      });

      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          userId: assignedToId,
          action: 'DOCUMENT_UPLOADED',
          description: `Proposal Sent: Uploaded commercial contract PDF.`,
          createdAt: dateAtOffset(50)
        }
      });
    }

    // G. Communication logs
    if (lead.status !== 'NEW') {
      await prisma.communicationLog.create({
        data: {
          leadId: lead.id,
          type: 'CALL',
          subject: 'Discovery & Scoping Scenarios',
          body: 'Discussed initial IT consultancy needs, active milestones, and expected project delivery timelines.',
          loggedBy: assignedToId ? (assignedToId === salesRep1.id ? salesRep1.name : salesRep2.name) : 'System',
          createdAt: dateAtOffset(15)
        }
      });
    }
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
