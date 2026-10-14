import mongoose from "mongoose";

const reviewEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "IN_REVIEW",
        "NEEDS_MORE_INFORMATION",
        "REFERRED_TO_CREDIT_TEAM",
        "REVIEW_COMPLETED"
      ],
      required: true
    },
    note: { type: String, trim: true, maxlength: 1500, default: "" },
    officerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    officerName: { type: String, required: true },
    occurredAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const officerReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: [
        "NOT_REVIEWED",
        "IN_REVIEW",
        "NEEDS_MORE_INFORMATION",
        "REFERRED_TO_CREDIT_TEAM",
        "REVIEW_COMPLETED"
      ],
      default: "NOT_REVIEWED"
    },
    // This is an operational next step for the existing lending workflow,
    // never a TrustID loan approval/rejection.
    nextStep: {
      type: String,
      enum: [
        "CONTINUE_EXISTING_LENDING_REVIEW",
        "REQUEST_MORE_INFORMATION",
        "REFER_TO_CREDIT_TEAM",
        "NO_FURTHER_TRUSTID_REVIEW"
      ],
      default: "CONTINUE_EXISTING_LENDING_REVIEW"
    },
    note: { type: String, trim: true, maxlength: 1500, default: "" },
    lastReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastReviewedByName: { type: String, default: "" },
    lastReviewedAt: Date,
    history: { type: [reviewEventSchema], default: [] }
  },
  { timestamps: true }
);

officerReviewSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model("OfficerReview", officerReviewSchema);
