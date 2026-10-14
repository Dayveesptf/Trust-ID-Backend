import mongoose from "mongoose";
import User from "../models/User.js";
import TrustProfile from "../models/TrustProfile.js";
import FinancialProfile from "../models/FinancialProfile.js";
import OfficerReview from "../models/OfficerReview.js";
import { ApiError } from "../utils/apiError.js";

const REVIEW_STATUSES = [
  "IN_REVIEW",
  "NEEDS_MORE_INFORMATION",
  "REFERRED_TO_CREDIT_TEAM",
  "REVIEW_COMPLETED"
];

const NEXT_STEP_BY_STATUS = {
  IN_REVIEW: "CONTINUE_EXISTING_LENDING_REVIEW",
  NEEDS_MORE_INFORMATION: "REQUEST_MORE_INFORMATION",
  REFERRED_TO_CREDIT_TEAM: "REFER_TO_CREDIT_TEAM",
  REVIEW_COMPLETED: "NO_FURTHER_TRUSTID_REVIEW"
};

function safeReview(review) {
  if (!review) {
    return {
      status: "NOT_REVIEWED",
      nextStep: "CONTINUE_EXISTING_LENDING_REVIEW",
      note: "",
      lastReviewedByName: "",
      lastReviewedAt: null,
      history: []
    };
  }

  return {
    _id: review._id,
    status: review.status,
    nextStep: review.nextStep,
    note: review.note || "",
    lastReviewedByName: review.lastReviewedByName || "",
    lastReviewedAt: review.lastReviewedAt || null,
    history: (review.history || []).map((event) => ({
      status: event.status,
      note: event.note || "",
      officerName: event.officerName,
      occurredAt: event.occurredAt
    }))
  };
}

async function loadSharedCustomerData() {
  // Only profiles the customer explicitly chose to share are visible here.
  const users = await User.find({
    role: "USER",
    "sharingConsent.granted": true
  })
    .select("firstName lastName email phone createdAt onboardingCompleted sharingConsent")
    .sort({ "sharingConsent.grantedAt": -1, createdAt: -1 })
    .lean();

  const ids = users.map((user) => user._id);
  if (!ids.length) return [];

  const [profiles, reviews] = await Promise.all([
    TrustProfile.find({ userId: { $in: ids } }).lean(),
    OfficerReview.find({ userId: { $in: ids } }).lean()
  ]);

  const profileMap = new Map(profiles.map((profile) => [profile.userId.toString(), profile]));
  const reviewMap = new Map(reviews.map((review) => [review.userId.toString(), review]));

  return users.map((user) => {
    const key = user._id.toString();
    const profile = profileMap.get(key);
    const review = reviewMap.get(key);

    return {
      ...user,
      sharingConsent: user.sharingConsent || { granted: false },
      trustProfile: profile
        ? {
            score: profile.totalScore,
            band: profile.band,
            generatedAt: profile.generatedAt,
            dataSource: profile.dataSource || "SIMULATED_DEMO",
            evidencePeriodMonths: profile.evidencePeriodMonths ?? 7
          }
        : null,
      review: safeReview(review)
    };
  });
}

export async function getOpportunities(req, res) {
  const opportunities = [
    {
      id: "ecobank-savings",
      category: "Savings",
      title: "Build Your Savings",
      description: "A savings opportunity designed to help you build a more consistent financial habit.",
      badge: "Recommended",
      relevance: "Your Trust Profile can be used to identify opportunities that support stronger savings behaviour.",
      eligibility: "Eligibility depends on the applicable Ecobank product criteria.",
      action: "https://www.ecobank.com/"
    },
    {
      id: "ecobank-credit",
      category: "Credit",
      title: "Explore Credit Opportunities",
      description: "Explore potential credit products that may be relevant to your financial profile.",
      badge: "Explore",
      relevance: "Your Trust Profile provides additional context around your financial behaviour.",
      eligibility: "Credit eligibility and approval are determined by Ecobank's applicable assessment criteria.",
      action: "https://www.ecobank.com/"
    },
    {
      id: "ecobank-business",
      category: "Business",
      title: "Business Banking",
      description: "Explore banking opportunities designed for entrepreneurs and growing businesses.",
      badge: "For Business",
      relevance: "This may be relevant if you are building or managing a business.",
      eligibility: "Eligibility depends on the selected Ecobank business product and applicable requirements.",
      action: "https://www.ecobank.com/"
    }
  ];

  res.json({ success: true, data: opportunities });
}

export async function getDashboardSummary(req, res) {
  const customers = await loadSharedCustomerData();
  const scored = customers.filter((customer) => customer.trustProfile);
  const scoreBands = {
    "Needs Improvement": 0,
    Developing: 0,
    Fair: 0,
    Good: 0,
    Strong: 0,
    Excellent: 0
  };

  scored.forEach((customer) => {
    const band = customer.trustProfile?.band;
    if (band in scoreBands) scoreBands[band] += 1;
  });

  const statusCounts = {
    NOT_REVIEWED: 0,
    IN_REVIEW: 0,
    NEEDS_MORE_INFORMATION: 0,
    REFERRED_TO_CREDIT_TEAM: 0,
    REVIEW_COMPLETED: 0
  };
  customers.forEach((customer) => {
    const status = customer.review?.status || "NOT_REVIEWED";
    if (status in statusCounts) statusCounts[status] += 1;
  });

  const averageScore = scored.length
    ? Math.round(scored.reduce((sum, customer) => sum + (customer.trustProfile?.score || 0), 0) / scored.length)
    : 0;

  res.json({
    success: true,
    data: {
      sharedProfiles: customers.length,
      analysedProfiles: scored.length,
      awaitingAnalysis: customers.length - scored.length,
      averageScore,
      scoreBands,
      reviews: statusCounts,
      prototypeDataSource: "SIMULATED_DEMO",
      note: "TrustID adds explainable financial-behaviour information to the existing lending review. It does not make the lending decision."
    }
  });
}

export async function getCustomers(req, res) {
  const customers = await loadSharedCustomerData();
  res.json({ success: true, data: customers });
}

export async function getCustomer(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, "Customer not found");
  }

  const user = await User.findOne({
    _id: req.params.id,
    role: "USER",
    "sharingConsent.granted": true
  })
    .select("firstName lastName email phone createdAt onboardingCompleted sharingConsent")
    .lean();

  if (!user) {
    throw new ApiError(404, "Customer not found or profile is not shared with Ecobank");
  }

  const [trustProfile, financialProfile, review] = await Promise.all([
    TrustProfile.findOne({ userId: user._id }).lean(),
    FinancialProfile.findOne({ userId: user._id }).lean(),
    OfficerReview.findOne({ userId: user._id }).lean()
  ]);

  const normalizedTrustProfile = trustProfile
    ? {
        ...trustProfile,
        dataSource: trustProfile.dataSource || financialProfile?.sourceType || "SIMULATED_DEMO",
        evidencePeriodMonths: trustProfile.evidencePeriodMonths ?? financialProfile?.evidencePeriodMonths ?? 7,
        scoreModelVersion: trustProfile.scoreModelVersion || "prototype-v1",
        recommendations: trustProfile.recommendations || []
      }
    : null;

  res.json({
    success: true,
    data: {
      customer: user,
      trustProfile: normalizedTrustProfile,
      financialEvidence: financialProfile
        ? {
            averageMonthlyInflow: financialProfile.averageMonthlyInflow,
            averageMonthlySavings: financialProfile.averageMonthlySavings,
            repaymentOnTimeRate: financialProfile.repaymentOnTimeRate,
            savingsRate: financialProfile.savingsRate,
            cashFlowStability: financialProfile.cashFlowStability,
            sourceType: financialProfile.sourceType || "SIMULATED_DEMO",
            evidencePeriodMonths: financialProfile.evidencePeriodMonths ?? 7,
            monthlyExpenses: financialProfile.monthlyExpenses,
            missedPayments: financialProfile.missedPayments,
            lowBalanceDays: financialProfile.lowBalanceDays,
            incomeConsistency: financialProfile.incomeConsistency,
            savingsStreakMonths: financialProfile.savingsStreakMonths,
            budgetingDiscipline: financialProfile.budgetingDiscipline,
            recurringPaymentConsistency: financialProfile.recurringPaymentConsistency
          }
        : null,
      review: safeReview(review),
      decisionNotice: "TrustID provides additional financial-behaviour information. Ecobank retains full responsibility for the lending decision and must continue its existing checks."
    }
  });
}

export async function saveCustomerReview(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, "Customer not found");
  }

  const { status, note = "" } = req.body;
  const normalizedNote = typeof note === "string" ? note.trim() : "";

  if (!REVIEW_STATUSES.includes(status)) {
    throw new ApiError(400, `status must be one of: ${REVIEW_STATUSES.join(", ")}`);
  }
  if (normalizedNote.length > 1500) {
    throw new ApiError(400, "Review note must be 1,500 characters or fewer");
  }
  if (["NEEDS_MORE_INFORMATION", "REFERRED_TO_CREDIT_TEAM"].includes(status) && !normalizedNote) {
    throw new ApiError(400, "Add a brief note explaining the follow-up step");
  }

  const customer = await User.findOne({
    _id: req.params.id,
    role: "USER",
    "sharingConsent.granted": true
  }).select("_id").lean();

  if (!customer) {
    throw new ApiError(404, "Customer not found or profile is no longer shared with Ecobank");
  }

  const officerName = `${req.user.firstName} ${req.user.lastName}`.trim();
  const savedReview = await OfficerReview.findOneAndUpdate(
    { userId: customer._id },
    {
      $set: {
        status,
        nextStep: NEXT_STEP_BY_STATUS[status],
        note: normalizedNote,
        lastReviewedBy: req.user._id,
        lastReviewedByName: officerName,
        lastReviewedAt: new Date()
      },
      $push: {
        history: {
          status,
          note: normalizedNote,
          officerId: req.user._id,
          officerName,
          occurredAt: new Date()
        }
      }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  res.json({ success: true, data: safeReview(savedReview) });
}
