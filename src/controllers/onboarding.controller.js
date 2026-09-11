import User from "../models/User.js";
import Onboarding from "../models/Onboarding.js";
import { ApiError } from "../utils/apiError.js";

export async function saveOnboarding(req, res) {
  const { incomeSource, incomeFrequency, goals = [] } = req.body;

  if (!incomeSource || !incomeFrequency) {
    throw new ApiError(400, "incomeSource and incomeFrequency are required");
  }

  const onboarding = await Onboarding.findOneAndUpdate(
    { userId: req.user._id },
    { incomeSource, incomeFrequency, goals },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  await User.findByIdAndUpdate(req.user._id, { onboardingCompleted: true });

  res.json({ success: true, data: onboarding });
}

export async function getOnboarding(req, res) {
  const onboarding = await Onboarding.findOne({ userId: req.user._id });
  res.json({ success: true, data: onboarding });
}

export async function grantConsent(req, res) {
  const { granted } = req.body;

  if (granted !== true) {
    throw new ApiError(400, "TrustID requires consent before analysing financial behaviour");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      consent: {
        granted: true,
        grantedAt: new Date(),
        version: "v1"
      }
    },
    { new: true }
  ).select("-password");

  res.json({ success: true, data: { consent: user.consent } });
}