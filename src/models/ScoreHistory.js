import mongoose from "mongoose";

const scoreHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true, min: 0, max: 850 },
    previousScore: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    reason: { type: String, default: "Trust Profile generated" }
  },
  { timestamps: true }
);

export default mongoose.model("ScoreHistory", scoreHistorySchema);