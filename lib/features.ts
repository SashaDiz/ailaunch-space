import { featuresConfig } from '@/config/features.config';
import type { FeaturesConfig } from '@/types/config';

type FeatureKey = keyof FeaturesConfig;

/**
 * Check if a feature module is enabled.
 * Works in both server and client components.
 */
export const isEnabled = (feature: FeatureKey): boolean =>
  featuresConfig[feature] === true;

/**
 * API route guard — returns a 404 Response if the feature is disabled.
 * Usage:
 *   const guard = featureGuard('competitions');
 *   if (guard) return guard;
 */
export function featureGuard(feature: FeatureKey): Response | null {
  if (!isEnabled(feature)) {
    return Response.json(
      { error: 'Feature not enabled' },
      { status: 404 }
    );
  }
  return null;
}
