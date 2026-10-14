import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["USER", "ECOBANK_OFFICER", "ADMIN"],
      default: "USER"
    },
    onboardingCompleted: { type: Boolean, default: false },
    consent: {
      granted: { type: Boolean, default: false },
      grantedAt: Date,
      version: { type: String, default: "v1" }
    },
    // Analysis consent and bank sharing are deliberately separate.
    // A customer profile is visible in the Ecobank workspace only after
    // the customer explicitly chooses to share it.
    sharingConsent: {
      granted: { type: Boolean, default: false },
      grantedAt: Date,
      revokedAt: Date,
      version: { type: String, default: "v1" }
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
