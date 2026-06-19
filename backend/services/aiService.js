/**
 * AI Lead Recommendation Service
 */
export async function generateLeadAdvice(lead, scoreRecord) {
  const { name, companyName, industry, budget, projectSize, urgency, source, notes, status } = lead;
  const { score, temperature } = scoreRecord;

  // Rule-based engine fallback
  const summary = `Lead ${name} representing "${companyName}" is a ${temperature} prospect (${score}/100) operating in the ${industry} industry. This lead was captured via ${source.toLowerCase()} and currently sits in the "${status}" status stage. They have indicated a ${budget.toLowerCase()} budget tier for a ${projectSize.toLowerCase()}-sized project, with a ${urgency.toLowerCase()} level of urgency.`;

  const followUps = [];
  const risks = [];
  const suggestions = [];

  // Determine Follow-ups based on Source and Urgency
  if (urgency === 'HIGH') {
    followUps.push('CRITICAL: Establish contact within 4 business hours. Send a direct calendar link to schedule a discovery session.');
  }

  if (source === 'WEBSITE') {
    followUps.push(`Send a automated custom introductory email thanking them for reaching out, attaching our IT consultancy credentials specific to ${industry}.`);
  } else if (source === 'LINKEDIN') {
    followUps.push('Send a personalized connection request on LinkedIn referencing their company and project inquiry.');
  } else if (source === 'REFERRAL') {
    followUps.push('Acknowledge the referral source via email and schedule an introductory coffee meeting or video call.');
  }

  followUps.push(`Prepare a customized pitch presentation focusing on our ${industry} consultancy expertise.`);

  // Determine Risks
  if (budget === 'LOW') {
    risks.push('Financial Risk: The budget tier is LOW. IT consultancy projects frequently require higher investment. Scope creep must be aggressively managed.');
  }
  if (urgency === 'LOW') {
    risks.push('Velocity Risk: Urgency is LOW. The sales cycle could drag out over several months. Focus on identifying early milestones to accelerate commitment.');
  }
  if (lead.industryFit === 'POOR') {
    risks.push(`Capability Risk: Industry fit is rated POOR. We may lack deep domain expertise in the "${industry}" sector. Pre-sales engineering support is required.`);
  }
  if (!notes || notes.trim().length < 20) {
    risks.push('Information Risk: Initial project description is very sparse. High likelihood of misaligned requirements.');
  }

  // Determine suggestions based on status and checklist
  if (status === 'NEW') {
    suggestions.push('Confirm whether the contact is the primary decision-maker or an influencer.');
    suggestions.push('Verify the exact budget range and funding source.');
  } else if (status === 'QUALIFIED') {
    suggestions.push('Gather technical specifications and current systems architecture details.');
    suggestions.push('Schedule a scoping workshop involving a Tech Lead.');
  } else if (status === 'CONTACTED') {
    suggestions.push('Follow up on the initial discussion within 48 hours to prevent lead coldness.');
    suggestions.push('Align on a concrete timeline for proposal delivery.');
  } else {
    suggestions.push('Prepare a draft Statement of Work (SOW) outlining milestones and project scope.');
    suggestions.push('Prepare a comparison sheet of our past projects in similar domains.');
  }

  // Calculate specific metrics for the AI Lead Insights Panel
  let riskScore = 15;
  if (budget === 'LOW') riskScore += 25;
  if (urgency === 'LOW') riskScore += 20;
  if (lead.industryFit === 'POOR') riskScore += 25;
  if (!notes || notes.trim().length < 20) riskScore += 15;
  riskScore = Math.min(riskScore, 100);

  let statusWeight = 10;
  if (status === 'QUALIFIED') statusWeight = 30;
  if (status === 'CONTACTED') statusWeight = 50;
  if (status === 'PROPOSAL_SENT') statusWeight = 70;
  if (status === 'NEGOTIATION') statusWeight = 85;
  if (status === 'WON') statusWeight = 100;
  if (status === 'LOST') statusWeight = 0;

  let conversionProbability = lead.conversionProbability !== undefined && lead.conversionProbability !== 0
    ? lead.conversionProbability
    : Math.round(score * 0.6 + statusWeight * 0.4);
  if (status === 'WON') conversionProbability = 100;
  if (status === 'LOST') conversionProbability = 0;

  let recommendedFollowUp = "";
  if (urgency === 'HIGH') {
    recommendedFollowUp = 'Establish contact within 4 business hours and send a direct calendar link to schedule a discovery session.';
  } else if (source === 'WEBSITE') {
    recommendedFollowUp = `Send an automated introductory email specific to the ${industry} industry.`;
  } else if (source === 'LINKEDIN') {
    recommendedFollowUp = 'Send a personalized LinkedIn connection request referencing their project inquiry.';
  } else {
    recommendedFollowUp = 'Acknowledge the referral source and schedule an introductory coffee meeting or call.';
  }

  let nextAction = "Establish initial contact and verify decision-making authority.";
  if (status === 'QUALIFIED') {
    nextAction = "Schedule a technical scoping workshop involving a Tech Lead.";
  } else if (status === 'CONTACTED') {
    nextAction = "Draft and deliver a customized commercial proposal.";
  } else if (status === 'PROPOSAL_SENT') {
    nextAction = "Follow up to address any objections and discuss commercial terms.";
  } else if (status === 'NEGOTIATION') {
    nextAction = "Finalize the Statement of Work (SOW) and request contract sign-off.";
  } else if (status === 'WON') {
    nextAction = "Initiate client onboarding sequence and project kickoff.";
  } else if (status === 'LOST') {
    nextAction = "Log qualification review reasons and archive lead.";
  }

  // Fallback structure
  return {
    summary,
    followUps,
    risks,
    suggestions,
    riskScore,
    conversionProbability,
    recommendedFollowUp,
    nextAction,
    isAiGenerated: false
  };
}
