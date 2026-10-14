import mongoose from "mongoose";

const financialProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // Competition prototype uses normalized behaviour metrics (0-100).
    // The current app records simulated data only. A future bank/statement
    // integration must verify source data on the server, not trust a client flag.
    sourceType: {
      type: String,
      enum: ["SIMULATED_DEMO", "AUTHORIZED_BANK_CONNECTION", "STATEMENT_UPLOAD"],
      default: "SIMULATED_DEMO"
    },
    evidencePeriodMonths: { type: Number, min: 0, max: 24, default: 7 },

    incomeConsistency: { type: Number, min: 0, max: 100, default: 0 },
    savingsRate: { type: Number, min: 0, max: 100, default: 0 },
    savingsStreakMonths: { type: Number, min: 0, max: 12, default: 0 },
    repaymentOnTimeRate: { type: Number, min: 0, max: 100, default: 0 },
    missedPayments: { type: Number, min: 0, max: 24, default: 0 },
    cashFlowStability: { type: Number, min: 0, max: 100, default: 0 },
    lowBalanceDays: { type: Number, min: 0, max: 31, default: 0 },
    budgetingDiscipline: { type: Number, min: 0, max: 100, default: 0 },
    recurringPaymentConsistency: { type: Number, min: 0, max: 100, default: 0 },

    averageMonthlyInflow: { type: Number, min: 0, default: 0 },
    averageMonthlySavings: { type: Number, min: 0, default: 0 },
    monthlyExpenses: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("FinancialProfile", financialProfileSchema);
