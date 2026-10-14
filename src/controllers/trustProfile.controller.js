import FinancialProfile from "../models/FinancialProfile.js";
import TrustProfile from "../models/TrustProfile.js";
import ScoreHistory from "../models/ScoreHistory.js";
import { calculateTrustScore, generateInsights } from "../scoring/scoreEngine.js";
import { ApiError } from "../utils/apiError.js";

export async function generateTrustProfile(req, res) {
  if (!req.user.consent?.granted) {
    throw new ApiError(403, "Grant consent before generating a Trust Profile");
  }

  const financial = await FinancialProfile.findOne({ userId: req.user._id }).lean();
  if (!financial) throw new ApiError(400, "Financial profile has not been submitted");

  const result = calculateTrustScore(financial);
  const insights = generateInsights(financial, result);

  const previous = await TrustProfile.findOne({ userId: req.user._id }).lean();
  const previousScore = previous?.totalScore || 0;

  const profile = await TrustProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      userId: req.user._id,
      totalScore: result.totalScore,
      band: result.band,
      dataSource: financial.sourceType || "SIMULATED_DEMO",
      evidencePeriodMonths: financial.evidencePeriodMonths ?? 7,
      scoreModelVersion: "prototype-v1",
      factors: {
        incomeConsistency: { score: result.factors.incomeConsistency, max: 200 },
        savingsBehaviour: { score: result.factors.savingsBehaviour, max: 150 },
        repaymentBehaviour: { score: result.factors.repaymentBehaviour, max: 200 },
        cashFlowStability: { score: result.factors.cashFlowStability, max: 150 },
        financialDiscipline: { score: result.factors.financialDiscipline, max: 150 }
      },
      strengths: insights.strengths,
      opportunities: insights.opportunities,
      recommendations: insights.recommendations,
      evidence: {
        averageMonthlyInflow: financial.averageMonthlyInflow,
        averageMonthlySavings: financial.averageMonthlySavings,
        repaymentOnTimeRate: financial.repaymentOnTimeRate,
        savingsRate: financial.savingsRate
      },
      generatedAt: new Date()
    },
    { new: true, upsert: true, runValidators: true }
  );

  await ScoreHistory.create({
    userId: req.user._id,
    score: result.totalScore,
    previousScore,
    change: result.totalScore - previousScore,
    reason: previous ? "Trust Profile recalculated" : "Initial Trust Profile generated"
  });

  res.json({
    success: true,
    data: {
      profile,
      recommendations: insights.recommendations
    }
  });
}

export async function getTrustProfile(req, res) {
  const profile = await TrustProfile.findOne({ userId: req.user._id });
  res.json({ success: true, data: profile });
}

export async function getScoreHistory(req, res) {
  const history = await ScoreHistory.find({ userId: req.user._id })
    .sort({ createdAt: 1 })
    .lean();

  res.json({ success: true, data: history });
}

export async function getInsights(req, res) {
  const [financial, profile] = await Promise.all([
    FinancialProfile.findOne({ userId: req.user._id }).lean(),
    TrustProfile.findOne({ userId: req.user._id }).lean()
  ]);

  if (!financial || !profile) throw new ApiError(404, "Trust Profile is not available yet");

  const result = calculateTrustScore(financial);
  const insights = generateInsights(financial, result);

  res.json({
    success: true,
    data: {
      strengths: insights.strengths,
      opportunities: insights.opportunities,
      recommendations: insights.recommendations
    }
  });
}