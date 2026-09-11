import mongoose from "mongoose";

const trustProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    totalScore: { type: Number, min: 0, max: 850, required: true },
    band: { type: String, required: true },

    factors: {
      incomeConsistency: { score: Number, max: { type: Number, default: 200 } },
      savingsBehaviour: { score: Number, max: { type: Number, default: 150 } },
      repaymentBehaviour: { score: Number, max: { type: Number, default: 200 } },
      cashFlowStability: { score: Number, max: { type: Number, default: 150 } },
      financialDiscipline: { score: Number, max: { type: Number, default: 150 } }
    },

    strengths: [{ type: String }],
    opportunities: [{ type: String }],
    evidence: {
      averageMonthlyInflow: Number,
      averageMonthlySavings: Number,
      repaymentOnTimeRate: Number,
      savingsRate: Number
    },

    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("TrustProfile", trustProfileSchema);