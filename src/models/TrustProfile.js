import mongoose from "mongoose";

const trustProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    totalScore: { type: Number, min: 0, max: 850, required: true },
    band: { type: String, required: true },

    // Makes the prototype's data source transparent to customers and bank staff.
    dataSource: {
      type: String,
      enum: ["SIMULATED_DEMO", "AUTHORIZED_BANK_CONNECTION", "STATEMENT_UPLOAD"],
      default: "SIMULATED_DEMO"
    },
    evidencePeriodMonths: { type: Number, min: 0, max: 24, default: 7 },
    scoreModelVersion: { type: String, default: "prototype-v1" },

    factors: {
      incomeConsistency: { score: Number, max: { type: Number, default: 200 } },
      savingsBehaviour: { score: Number, max: { type: Number, default: 150 } },
      repaymentBehaviour: { score: Number, max: { type: Number, default: 200 } },
      cashFlowStability: { score: Number, max: { type: Number, default: 150 } },
      financialDiscipline: { score: Number, max: { type: Number, default: 150 } }
    },

    strengths: { type: [String], default: [] },
    opportunities: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
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
