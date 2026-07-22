export const PREMIUM_FEATURES = {
  AI_GENERATE_FROM_MATERIAL: "ai_generate_from_material",
};

export const PREMIUM_REQUIRED_MESSAGE =
  "This feature is available for Premium accounts only. Please upgrade to continue.";

export function canUsePremiumFeature(profile, featureCode) {
  if (!profile?.premium?.active) return false;

  return (profile.premium.features || []).some((feature) => {
    if (typeof feature === "string") return feature === featureCode;
    return feature?.feature_code === featureCode;
  });
}
