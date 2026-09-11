import mongoose from "mongoose";

const onboardingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    incomeSource: {
      type: String,
      enum: ["salary", "business", "freelance", "allowance", "multiple", "other"],
      required: true
    },
    incomeFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "irregular"],
      required: true
    },
    goals: [{
      type: String,
      enum: ["save", "access_credit", "start_business", "manage_spending", "build_credibility"]
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Onboarding", onboardingSchema);