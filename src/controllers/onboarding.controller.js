import User from "../models/User.js";
import Onboarding from "../models/Onboarding.js";
import TrustProfile from "../models/TrustProfile.js";
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

/**
 * Customer-controlled permission to make a generated TrustID profile visible
 * in the Ecobank review workspace. It is intentionally separate from consent
 * to analyse financial behaviour.
 */
export async function updateEcobankSharingConsent(req, res) {
  const { granted } = req.body;

  if (typeof granted !== "boolean") {
    throw new ApiError(400, "granted must be true or false");
  }

  if (granted) {
    if (!req.user.consent?.granted) {
      throw new ApiError(403, "Grant analysis consent before sharing a TrustID profile");
    }

    const profile = await TrustProfile.findOne({ userId: req.user._id }).select("_id").lean();
    if (!profile) {
      throw new ApiError(400, "Generate your TrustID profile before sharing it with Ecobank");
    }
  }

  const now = new Date();
  const sharingConsent = granted
    ? { granted: true, grantedAt: now, revokedAt: null, version: "v1" }
    : { granted: false, grantedAt: req.user.sharingConsent?.grantedAt || null, revokedAt: now, version: "v1" };

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { sharingConsent },
    { new: true, runValidators: true }
  ).select("sharingConsent");

  res.json({
    success: true,
    data: {
      sharingConsent: user.sharingConsent,
      message: granted
        ? "Your TrustID profile is now visible in the Ecobank prototype review workspace."
        : "Your TrustID profile is no longer visible in the Ecobank prototype review workspace."
    }
  });
}
