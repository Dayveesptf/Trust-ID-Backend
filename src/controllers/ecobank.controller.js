import User from "../models/User.js";
import TrustProfile from "../models/TrustProfile.js";
import FinancialProfile from "../models/FinancialProfile.js";
import { ApiError } from "../utils/apiError.js";

export async function getOpportunities(req, res) {
  const opportunities = [
    {
      id: "ecobank-savings",
      category: "Savings",
      title: "Build Your Savings",
      description:
        "A savings opportunity designed to help you build a more consistent financial habit.",
      badge: "Recommended",
      relevance:
        "Your Trust Profile can be used to identify opportunities that support stronger savings behaviour.",
      eligibility:
        "Eligibility depends on the applicable Ecobank product criteria.",
      action: "https://www.ecobank.com/"
    },
    {
      id: "ecobank-credit",
      category: "Credit",
      title: "Explore Credit Opportunities",
      description:
        "Explore potential credit products that may be relevant to your financial profile.",
      badge: "Explore",
      relevance:
        "Your Trust Profile provides additional context around your financial behaviour.",
      eligibility:
        "Credit eligibility and approval are determined by Ecobank's applicable assessment criteria.",
      action: "https://www.ecobank.com/"
    },
    {
      id: "ecobank-business",
      category: "Business",
      title: "Business Banking",
      description:
        "Explore banking opportunities designed for entrepreneurs and growing businesses.",
      badge: "For Business",
      relevance:
        "This may be relevant if you are building or managing a business.",
      eligibility:
        "Eligibility depends on the selected Ecobank business product and applicable requirements.",
      action: "https://www.ecobank.com/"
    }
  ];

  res.json({
    success: true,
    data: opportunities
  });
}

export async function getCustomers(req, res) {
  const users = await User.find({ role: "USER" })
    .select(
      "firstName lastName email phone createdAt onboardingCompleted"
    )
    .sort({ createdAt: -1 })
    .lean();

  const ids = users.map((user) => user._id);

  const profiles = await TrustProfile.find({
    userId: { $in: ids }
  }).lean();

  const profileMap = new Map(
    profiles.map((profile) => [
      profile.userId.toString(),
      profile
    ])
  );

  const customers = users.map((user) => {
    const profile = profileMap.get(user._id.toString());

    return {
      ...user,
      trustProfile: profile
        ? {
            score: profile.totalScore,
            band: profile.band
          }
        : null
    };
  });

  res.json({
    success: true,
    data: customers
  });
}

export async function getCustomer(req, res) {
  const user = await User.findOne({
    _id: req.params.id,
    role: "USER"
  })
    .select(
      "firstName lastName email phone createdAt onboardingCompleted"
    )
    .lean();

  if (!user) {
    throw new ApiError(404, "Customer not found");
  }

  const [trustProfile, financialProfile] =
    await Promise.all([
      TrustProfile.findOne({
        userId: user._id
      }).lean(),

      FinancialProfile.findOne({
        userId: user._id
      }).lean()
    ]);

  res.json({
    success: true,
    data: {
      customer: user,

      trustProfile,

      financialEvidence: financialProfile
        ? {
            averageMonthlyInflow:
              financialProfile.averageMonthlyInflow,

            averageMonthlySavings:
              financialProfile.averageMonthlySavings,

            repaymentOnTimeRate:
              financialProfile.repaymentOnTimeRate,

            savingsRate:
              financialProfile.savingsRate,

            cashFlowStability:
              financialProfile.cashFlowStability
          }
        : null,

      decisionNotice:
        "TrustID provides decision-support information. Ecobank retains full responsibility for the lending decision."
    }
  });
}