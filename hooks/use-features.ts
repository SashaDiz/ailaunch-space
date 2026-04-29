import { featuresConfig } from '@/config/features.config';
import type { FeaturesConfig } from '@/types/config';

/**
 * Hook for accessing feature flags in client components.
 * Returns the full features config object.
 */
export const useFeatures = (): FeaturesConfig => featuresConfig;
