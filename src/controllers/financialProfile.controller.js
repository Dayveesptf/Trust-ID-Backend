import FinancialProfile from "../models/FinancialProfile.js";

const allowedFields = [
  "incomeConsistency",
  "savingsRate",
  "savingsStreakMonths",
  "repaymentOnTimeRate",
  "missedPayments",
  "cashFlowStability",
  "lowBalanceDays",
  "budgetingDiscipline",
  "recurringPaymentConsistency",
  "averageMonthlyInflow",
  "averageMonthlySavings",
  "monthlyExpenses"
];

export async function upsertFinancialProfile(req, res) {
  if (!req.user.consent?.granted) {
    return res.status(403).json({
      success: false,
      message: "Grant consent before submitting financial behaviour data"
    });
  }

  const payload = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  }

  const profile = await FinancialProfile.findOneAndUpdate(
    { userId: req.user._id },
    payload,
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, data: profile });
}

export async function getFinancialProfile(req, res) {
  const profile = await FinancialProfile.findOne({ userId: req.user._id });
  res.json({ success: true, data: profile });
}