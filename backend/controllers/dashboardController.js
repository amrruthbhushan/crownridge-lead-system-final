import prisma from '../services/db.js';

/**
 * Get Dashboard analytics metrics with detailed CRM statistics
 */
export async function getDashboardStats(req, res) {
  const isSalesRep = req.user.role === 'SALES_REP';
  const userId = req.user.id;

  // Base filters for RBAC
  const baseFilter = {};
  if (isSalesRep) {
    baseFilter.assignment = {
      assignedToId: userId
    };
  }

  // Budget Tier to cash mapping
  const getBudgetVal = (b) => {
    if (b === 'HIGH') return 150000;
    if (b === 'MEDIUM') return 50000;
    return 10000; // LOW
  };

  // Status to probability mapping for Expected Revenue calculations
  const getProbability = (s) => {
    switch (s) {
      case 'WON': return 1.0;
      case 'NEGOTIATION': return 0.8;
      case 'PROPOSAL_SENT': return 0.6;
      case 'CONTACTED': return 0.4;
      case 'QUALIFIED': return 0.2;
      case 'NEW': return 0.1;
      default: return 0.0; // LOST
    }
  };

  try {
    // 1. Fetch all leads under this filter to calculate weighted metrics
    const leads = await prisma.lead.findMany({
      where: baseFilter,
      include: {
        score: true,
        assignment: {
          include: {
            assignedTo: { select: { id: true, name: true } }
          }
        }
      }
    });

    const totalLeads = leads.length;

    // 2. Core CRM Card Metrics
    const newLeads = leads.filter(l => l.status === 'NEW').length;
    const hotLeads = leads.filter(l => l.score?.temperature === 'HOT').length;
    const wonLeads = leads.filter(l => l.status === 'WON').length;
    const lostLeads = leads.filter(l => l.status === 'LOST').length;

    // Revenue calculations
    const revenuePipeline = leads.reduce((sum, l) => sum + getBudgetVal(l.budget), 0);
    const expectedRevenue = leads.reduce((sum, l) => sum + getBudgetVal(l.budget) * getProbability(l.status), 0);

    // Score calculations
    const totalScore = leads.reduce((sum, l) => sum + (l.score?.score || 0), 0);
    const averageLeadScore = totalLeads > 0 ? Math.round(totalScore / totalLeads) : 0;

    // Active Sales Reps
    const activeSalesReps = await prisma.user.count({
      where: { role: 'SALES_REP' }
    });

    // Conversion rate (WON / (WON + LOST))
    const closedCount = wonLeads + lostLeads;
    const conversionRate = closedCount > 0 ? Math.round((wonLeads / closedCount) * 100) : 0;

    // 3. Monthly Growth Calculation
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const leadsThisMonth = leads.filter(l => new Date(l.createdAt) >= startOfThisMonth).length;
    const leadsLastMonth = leads.filter(l => {
      const date = new Date(l.createdAt);
      return date >= startOfLastMonth && date < startOfThisMonth;
    }).length;

    let monthlyGrowth = 0;
    if (leadsLastMonth > 0) {
      monthlyGrowth = Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100);
    } else if (leadsThisMonth > 0) {
      monthlyGrowth = 100; // Starting fresh
    }

    // 4. Lead Status Funnel Grouping
    const statuses = ['NEW', 'QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST'];
    const leadsByStatus = statuses.map(status => {
      const count = leads.filter(l => l.status === status).length;
      return { name: status.replace('_', ' '), value: count };
    });

    // 5. Lead Source distribution
    const sources = ['WEBSITE', 'LINKEDIN', 'REFERRAL'];
    const leadsBySource = sources.map(source => {
      const count = leads.filter(l => l.source === source).length;
      return { name: source, value: count };
    });

    // 6. Sales Performance Chart
    const salesReps = await prisma.user.findMany({
      where: { role: 'SALES_REP' },
      include: {
        assignments: {
          include: { lead: true }
        }
      }
    });

    const salesPerformance = salesReps.map(rep => {
      const assignedLeads = rep.assignments.map(a => a.lead).filter(Boolean);
      const wonCount = assignedLeads.filter(l => l.status === 'WON').length;
      return {
        name: rep.name,
        assigned: assignedLeads.length,
        won: wonCount
      };
    });

    // 7. Revenue Forecast (Probability weighted revenue grouped by stage)
    const revenueForecast = statuses.filter(s => s !== 'LOST').map(status => {
      const stageLeads = leads.filter(l => l.status === status);
      const value = stageLeads.reduce((sum, l) => sum + getBudgetVal(l.budget) * getProbability(l.status), 0);
      return { name: status.replace('_', ' '), value };
    });

    // 8. Monthly Lead Volumes and Conversion Trends
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);

    const yearLeads = leads.filter(l => new Date(l.createdAt) >= startOfYear);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyTrends = months.map((month, idx) => {
      const monthLeads = yearLeads.filter(lead => {
        const date = new Date(lead.createdAt);
        return date.getMonth() === idx;
      });

      const count = monthLeads.length;
      const won = monthLeads.filter(l => l.status === 'WON').length;
      const closed = monthLeads.filter(l => ['WON', 'LOST'].includes(l.status)).length;
      const rate = closed > 0 ? Math.round((won / closed) * 100) : 0;

      return {
        month,
        count,
        rate
      };
    });

    // 9. Recent Activity Logs
    const logFilter = {};
    if (isSalesRep) {
      logFilter.lead = {
        assignment: {
          assignedToId: userId
        }
      };
    }

    const recentActivities = await prisma.activityLog.findMany({
      where: logFilter,
      include: {
        user: { select: { id: true, name: true, role: true } },
        lead: { select: { id: true, companyName: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return res.json({
      cards: {
        totalLeads,
        newLeads,
        hotLeads,
        wonLeads,
        lostLeads,
        revenuePipeline,
        expectedRevenue,
        averageLeadScore,
        conversionRate,
        monthlyGrowth,
        activeSalesReps
      },
      charts: {
        leadsByStatus,
        leadsBySource,
        salesPerformance,
        revenueForecast,
        monthlyTrends
      },
      recentActivities,
      recentLeads: leads.slice(0, 5) // Recent 5 leads based on DB fetch order
    });
  } catch (error) {
    console.error('Error compiling detailed dashboard stats:', error);
    return res.status(500).json({ error: 'Server error generating dashboard analytics.' });
  }
}

/**
 * Get row counts for all system entities to prove database design and activity
 */
export async function getDatabaseSchemaStats(req, res) {
  try {
    const users = await prisma.user.count();
    const leads = await prisma.lead.count();
    const leadScores = await prisma.leadScore.count();
    const assignments = await prisma.assignment.count();
    const notifications = await prisma.notification.count();
    const checklists = await prisma.checklist.count();
    const activities = await prisma.activityLog.count();
    const reports = await prisma.report.count();
    const statusHistory = await prisma.statusHistory.count();
    const assignmentHistory = await prisma.assignmentHistory.count();
    const documents = await prisma.document.count();
    const communicationLogs = await prisma.communicationLog.count();

    return res.json({
      counts: {
        users,
        leads,
        leadScores,
        assignments,
        notifications,
        checklists,
        activities,
        reports,
        statusHistory,
        assignmentHistory,
        documents,
        communicationLogs
      }
    });
  } catch (error) {
    console.error('Error fetching database schema stats:', error);
    return res.status(500).json({ error: 'Server error fetching database stats.' });
  }
}

