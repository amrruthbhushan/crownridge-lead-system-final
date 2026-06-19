/**
 * Scoring Engine for Leads
 */
export function calculateScore(lead) {
  const budget = lead.budget;
  const projectSize = lead.projectSize;
  const urgency = lead.urgency;
  const industryFit = lead.industryFit;

  // 1. Budget Score (Low = 10, Medium = 20, High = 30)
  let budgetScore = 10;
  if (budget === 'MEDIUM') budgetScore = 20;
  else if (budget === 'HIGH') budgetScore = 30;

  // 2. Project Size Score (Small = 10, Medium = 20, Large = 30)
  let projectSizeScore = 10;
  if (projectSize === 'MEDIUM') projectSizeScore = 20;
  else if (projectSize === 'LARGE') projectSizeScore = 30;

  // 3. Urgency Score (Low = 5, Medium = 10, High = 20)
  let urgencyScore = 5;
  if (urgency === 'MEDIUM') urgencyScore = 10;
  else if (urgency === 'HIGH') urgencyScore = 20;

  // 4. Industry Fit Score (Poor = 5, Good = 15, Excellent = 20)
  let industryFitScore = 5;
  if (industryFit === 'GOOD') industryFitScore = 15;
  else if (industryFit === 'EXCELLENT') industryFitScore = 20;

  const score = budgetScore + projectSizeScore + urgencyScore + industryFitScore;

  // Determine lead temperature
  // 0-30 = Cold Lead
  // 31-60 = Warm Lead
  // 61-100 = Hot Lead
  let temperature = 'COLD';
  if (score > 30 && score <= 60) {
    temperature = 'WARM';
  } else if (score > 60) {
    temperature = 'HOT';
  }

  return {
    score,
    temperature,
    budgetScore,
    projectSizeScore,
    urgencyScore,
    industryFitScore,
  };
}
