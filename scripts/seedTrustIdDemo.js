import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import FinancialProfile from "../src/models/FinancialProfile.js";
import TrustProfile from "../src/models/TrustProfile.js";
import ScoreHistory from "../src/models/ScoreHistory.js";
import { calculateTrustScore, generateInsights } from "../src/scoring/scoreEngine.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is missing from the environment.");

// Competition-only sample account. Override the password before running this
// script on any shared environment.
const demoCustomer = {
  firstName: "Amara",
  lastName: "Okafor",
  email: "demo.customer@trustid.test",
  phone: "08000000001",
  password: process.env.TRUSTID_DEMO_CUSTOMER_PASSWORD || "TrustIDDemo123!"
};

const demoFinancialProfile = {
  incomeConsistency: 99,
  savingsRate: 92,
  savingsStreakMonths: 4,
  repaymentOnTimeRate: 95,
  missedPayments: 1,
  cashFlowStability: 90,
  lowBalanceDays: 3,
  budgetingDiscipline: 90,
  recurringPaymentConsistency: 90,
  averageMonthlyInflow: 450000,
  averageMonthlySavings: 90000,
  monthlyExpenses: 320000,
  evidencePeriodMonths: 7
};

async function seed() {
  await mongoose.connect(MONGODB_URI);

  try {
    const hashedPassword = await bcrypt.hash(demoCustomer.password, 12);
    const user = await User.findOneAndUpdate(
      { email: demoCustomer.email },
      {
        $set: {
          firstName: demoCustomer.firstName,
          lastName: demoCustomer.lastName,
          phone: demoCustomer.phone,
          role: "USER",
          onboardingCompleted: true,
          consent: { granted: true, grantedAt: new Date(), version: "v1" },
          // This is a seed-only demo fixture to make the bank portal testable.
          sharingConsent: { granted: true, grantedAt: new Date(), revokedAt: null, version: "v1" }
        },
        $setOnInsert: { password: hashedPassword }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const financial = await FinancialProfile.findOneAndUpdate(
      { userId: user._id },
      { ...demoFinancialProfile, sourceType: "SIMULATED_DEMO" },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    const result = calculateTrustScore(financial);
    const insights = generateInsights(financial, result);
    const previous = await TrustProfile.findOne({ userId: user._id }).lean();

    await TrustProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        totalScore: result.totalScore,
        band: result.band,
        dataSource: "SIMULATED_DEMO",
        evidencePeriodMonths: financial.evidencePeriodMonths,
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

    if (!previous) {
      await ScoreHistory.create({
        userId: user._id,
        score: result.totalScore,
        previousScore: 0,
        change: result.totalScore,
        reason: "Competition demo profile seeded"
      });
    }

    console.log("TrustID demo customer is ready.");
    console.log(`Customer: ${demoCustomer.email}`);
    console.log(`Score: ${result.totalScore}/850 (${result.band})`);
    console.log("Source: simulated competition data");
    console.log("A bank officer can sign in and view this shared profile.");
    console.log("Do not use the default demo password outside local competition testing.");
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error("Could not seed TrustID demo customer:", error.message);
  process.exitCode = 1;
});
