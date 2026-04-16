import { useMemo } from 'react';
import { useAuth } from '../services/auth';
import tierData from '../../shared/tier-limits.json';

export type TierName = 'free' | 'pro';

interface TierInfo {
  /** Current resolved tier: 'free' | 'pro' */
  tier: TierName;
  /** true if user has PRO access */
  isPro: boolean;
  /** Check if a feature is available (limit > 0 or boolean true) */
  canUse: (feature: string) => boolean;
  /** Check if a feature is completely blocked (limit === 0 or boolean false) */
  isBlocked: (feature: string) => boolean;
  /** Get the raw limit config for an AI feature */
  getAiLimit: (feature: string) => { limit: number; window: string } | boolean | number | undefined;
  /** Get boolean feature value */
  getFeature: (feature: string) => boolean;
  /** Full plan config */
  plan: typeof tierData.plans.free;
}

/**
 * Hook para verificar el tier del usuario y sus límites.
 * Usa shared/tier-limits.json como fuente de verdad (misma que el backend).
 */
export function useTier(): TierInfo {
  const { user } = useAuth();

  return useMemo(() => {
    // Resolver tier: owner → pro, trial activo → pro, todo lo demás → free
    const status = user?.subscriptionStatus;
    const rawTier = user?.subscriptionTier;
    const isPro =
      status === 'owner' || (rawTier === 'pro' && (status === 'active' || status === 'trial'));
    const tier: TierName = isPro ? 'pro' : 'free';
    const plan = tierData.plans[tier];

    const canUse = (feature: string): boolean => {
      // Check AI features first
      const ai = (plan.ai as Record<string, unknown>)[feature];
      if (ai !== undefined) {
        if (typeof ai === 'boolean') return ai;
        if (typeof ai === 'number') return ai !== 0;
        if (typeof ai === 'object' && ai !== null && 'limit' in ai) {
          return (ai as { limit: number }).limit !== 0;
        }
        return true;
      }
      // Check boolean features
      const feat = (plan.features as Record<string, boolean>)[feature];
      if (feat !== undefined) return feat;
      // Check general limits
      const lim = (plan.limits as Record<string, unknown>)[feature];
      if (typeof lim === 'number') return lim !== 0;
      // Unknown feature → allow (don't block by default)
      return true;
    };

    const isBlocked = (feature: string): boolean => !canUse(feature);

    const getAiLimit = (feature: string) => {
      const ai = (plan.ai as Record<string, unknown>)[feature];
      return ai as { limit: number; window: string } | boolean | number | undefined;
    };

    const getFeature = (feature: string): boolean => {
      return (plan.features as Record<string, boolean>)[feature] ?? true;
    };

    return { tier, isPro, canUse, isBlocked, getAiLimit, getFeature, plan };
  }, [user?.subscriptionStatus, user?.subscriptionTier]);
}
