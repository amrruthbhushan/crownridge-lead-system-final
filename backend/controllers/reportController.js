import prisma from '../services/db.js';

/**
 * Get Report Summary Data
 */
export async function getReportsSummary(req, res) {
  try {
    // 1. Lead Performance Data
    const leads = await prisma.lead.findMany({
      include: {
        score: true,
        assignment: { include: { assignedTo: { select: { name: true } } } }
      }
    });

    const leadPerformance = leads.map(l => ({
      id: l.id,
      name: l.name,
      company: l.companyName,
      source: l.source,
      budget: l.budget,
      score: l.score?.score || 0,
      temperature: l.score?.temperature || 'COLD',
      assignedTo: l.assignment?.assignedTo?.name || 'Unassigned',
      status: l.status,
      estimatedBudget: l.estimatedBudget || 0,
      expectedRevenue: l.expectedRevenue || 0,
      conversionProbability: l.conversionProbability || 0,
      createdAt: l.createdAt
    }));

    // 2. Sales Representative Performance Data
    const salesReps = await prisma.user.findMany({
      where: { role: 'SALES_REP' },
      include: {
        assignments: {
          include: {
            lead: true
          }
        }
      }
    });

    const salesPerformance = salesReps.map(rep => {
      const assignedLeads = rep.assignments.map(a => a.lead).filter(Boolean);
      const total = assignedLeads.length;
      const won = assignedLeads.filter(l => l.status === 'WON').length;
      const lost = assignedLeads.filter(l => l.status === 'LOST').length;
      const active = total - won - lost;
      
      const closed = won + lost;
      const conversionRate = closed > 0 ? Math.round((won / closed) * 100) : 0;

      return {
        repId: rep.id,
        name: rep.name,
        email: rep.email,
        assignedLeadsCount: total,
        wonCount: won,
        lostCount: lost,
        activeCount: active,
        conversionRate,
      };
    });

    // 3. Pipeline Conversion Funnel Data
    const totalLeadsCount = await prisma.lead.count();
    const statuses = ['NEW', 'QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST'];
    
    const conversionData = await Promise.all(
      statuses.map(async (status) => {
        const count = await prisma.lead.count({ where: { status } });
        const percentage = totalLeadsCount > 0 ? Math.round((count / totalLeadsCount) * 100) : 0;
        return {
          status: status.replace('_', ' '),
          count,
          percentage
        };
      })
    );

    return res.json({
      leadPerformance,
      salesPerformance,
      conversionReport: conversionData
    });
  } catch (error) {
    console.error('Error generating reports data:', error);
    return res.status(500).json({ error: 'Server error generating reports data.' });
  }
}

/**
 * Export report as CSV file
 */
export async function exportReportCSV(req, res) {
  const { type = 'leads', format = 'csv' } = req.query; // 'leads', 'sales', 'conversion'; 'csv', 'excel'
  const isExcel = format === 'excel';
  const delim = isExcel ? '\t' : ',';

  try {
    let csvContent = '';
    let filename = '';

    if (type === 'leads') {
      const leads = await prisma.lead.findMany({
        include: {
          score: true,
          assignment: { include: { assignedTo: { select: { name: true } } } },
          checklist: true
        }
      });

      filename = isExcel ? 'leads_performance_report.xls' : 'leads_performance_report.csv';
      const headers = ['Lead Name', 'Company Name', 'Email', 'Phone', 'Industry', 'Source', 'Budget', 'Project Size', 'Urgency', 'Estimated Budget', 'Conversion Probability %', 'Expected Revenue', 'Score', 'Temperature', 'Status', 'Assigned To', 'Checklist Progress %'];
      csvContent = headers.join(delim) + '\n';
      
      leads.forEach(l => {
        const row = [
          `"${l.name.replace(/"/g, '""')}"`,
          `"${l.companyName.replace(/"/g, '""')}"`,
          `"${l.email.replace(/"/g, '""')}"`,
          `"${l.phone}"`,
          `"${l.industry}"`,
          l.source,
          l.budget,
          l.projectSize,
          l.urgency,
          l.estimatedBudget || 0,
          l.conversionProbability || 0,
          l.expectedRevenue || 0,
          l.score?.score || 0,
          l.score?.temperature || 'COLD',
          l.status,
          `"${(l.assignment?.assignedTo?.name || 'Unassigned').replace(/"/g, '""')}"`,
          `${l.checklist?.progress || 0}%`
        ];
        csvContent += row.join(delim) + '\n';
      });

    } else if (type === 'sales') {
      const salesReps = await prisma.user.findMany({
        where: { role: 'SALES_REP' },
        include: {
          assignments: { include: { lead: true } }
        }
      });

      filename = isExcel ? 'sales_performance_report.xls' : 'sales_performance_report.csv';
      const headers = ['Representative Name', 'Email', 'Assigned Leads', 'Won Leads', 'Lost Leads', 'Active Leads', 'Conversion Rate %'];
      csvContent = headers.join(delim) + '\n';

      salesReps.forEach(rep => {
        const assignedLeads = rep.assignments.map(a => a.lead).filter(Boolean);
        const total = assignedLeads.length;
        const won = assignedLeads.filter(l => l.status === 'WON').length;
        const lost = assignedLeads.filter(l => l.status === 'LOST').length;
        const active = total - won - lost;
        const closed = won + lost;
        const conversionRate = closed > 0 ? Math.round((won / closed) * 100) : 0;
        const row = [
          `"${rep.name.replace(/"/g, '""')}"`,
          `"${rep.email}"`,
          total,
          won,
          lost,
          active,
          `${conversionRate}%`
        ];
        csvContent += row.join(delim) + '\n';
      });

    } else if (type === 'conversion') {
      const totalLeadsCount = await prisma.lead.count();
      const statuses = ['NEW', 'QUALIFIED', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST'];
      
      filename = isExcel ? 'pipeline_conversion_report.xls' : 'pipeline_conversion_report.csv';
      const headers = ['Pipeline Status Stage', 'Lead Count', 'Percentage of Pipeline'];
      csvContent = headers.join(delim) + '\n';

      for (const status of statuses) {
        const count = await prisma.lead.count({ where: { status } });
        const percentage = totalLeadsCount > 0 ? Math.round((count / totalLeadsCount) * 100) : 0;
        const row = [
          status.replace('_', ' '),
          count,
          `${percentage}%`
        ];
        csvContent += row.join(delim) + '\n';
      }
    } else {
      return res.status(400).json({ error: 'Invalid report type requested.' });
    }

    if (isExcel) {
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
    } else {
      res.setHeader('Content-Type', 'text/csv');
    }
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(csvContent);

  } catch (error) {
    console.error('Error exporting report:', error);
    return res.status(500).json({ error: 'Server error generating report file.' });
  }
}
