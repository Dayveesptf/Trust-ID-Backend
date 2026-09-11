const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function getScoreBand(score) {
  if (score >= 800) return "Excellent";
  if (score >= 700) return "Strong";
  if (score >= 600) return "Good";
  if (score >= 500) return "Fair";
  if (score >= 400) return "Developing";
  return "Needs Improvement";
}

/**
 * Prototype scoring model: 850 points total.
 *
 * Income Consistency      200
 * Savings Behaviour       150
 * Repayment Behaviour     200
 * Cash-flow Stability     150
 * Financial Discipline    150
 */
export function calculateTrustScore(data) {
  const income = clamp(Number(data.incomeConsistency || 0), 0, 100) * 2;

  const savingsRate = clamp(Number(data.savingsRate || 0), 0, 100);
  const savingsStreak = clamp(Number(data.savingsStreakMonths || 0), 0, 12);
  const savings = (savingsRate * 0.75) + (savingsStreak * 6.25);

  const repaymentRate = clamp(Number(data.repaymentOnTimeRate || 0), 0, 100);
  const missedPayments = clamp(Number(data.missedPayments || 0), 0, 24);
  const repayment = clamp((repaymentRate * 2) - (missedPayments * 4), 0, 200);

  const stability = clamp(Number(data.cashFlowStability || 0), 0, 100) * 1.5;

  const budgeting = clamp(Number(data.budgetingDiscipline || 0), 0, 100);
  const recurring = clamp(Number(data.recurringPaymentConsistency || 0), 0, 100);
  const lowBalanceDays = clamp(Number(data.lowBalanceDays || 0), 0, 31);
  const discipline = clamp(
    (budgeting * 0.75) + (recurring * 0.75) - (lowBalanceDays * 2),
    0,
    150
  );

  const factors = {
    incomeConsistency: Math.round(income),
    savingsBehaviour: Math.round(savings),
    repaymentBehaviour: Math.round(repayment),
    cashFlowStability: Math.round(stability),
    financialDiscipline: Math.round(discipline)
  };

  const totalScore = clamp(
    Object.values(factors).reduce((sum, value) => sum + value, 0),
    0,
    850
  );

  return {
    totalScore,
    band: getScoreBand(totalScore),
    factors
  };
}

export function generateInsights(data, result) {
  const labels = [
    ["Income consistency", result.factors.incomeConsistency, 200],
    ["Savings behaviour", result.factors.savingsBehaviour, 150],
    ["Repayment behaviour", result.factors.repaymentBehaviour, 200],
    ["Cash-flow stability", result.factors.cashFlowStability, 150],
    ["Financial discipline", result.factors.financialDiscipline, 150]
  ];

  const strengths = labels
    .filter(([, score, max]) => score / max >= 0.8)
    .sort((a, b) => (b[1] / b[2]) - (a[1] / a[2]))
    .slice(0, 2)
    .map(([name]) => name);

  const opportunities = labels
    .filter(([, score, max]) => score / max < 0.7)
    .sort((a, b) => (a[1] / a[2]) - (b[1] / b[2]))
    .slice(0, 3)
    .map(([name]) => name);

  const recommendations = [];

  if (Number(data.savingsStreakMonths || 0) < 3) {
    recommendations.push("Build a consistent savings streak of at least 3 months.");
  }
  if (Number(data.repaymentOnTimeRate || 0) < 90) {
    recommendations.push("Keep recurring repayments and bills on schedule.");
  }
  if (Number(data.cashFlowStability || 0) < 75) {
    recommendations.push("Reduce large cash-flow swings and maintain a stronger end-of-month balance.");
  }
  if (Number(data.lowBalanceDays || 0) > 5) {
    recommendations.push("Reduce the number of days your account stays at a very low balance.");
  }
  if (!recommendations.length) {
    recommendations.push("Maintain your current habits and keep building a consistent financial track record.");
  }

  return { strengths, opportunities, recommendations };
}