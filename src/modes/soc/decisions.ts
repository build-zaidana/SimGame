export const SOC_DECISIONS = ['allow', 'block', 'escalate'] as const;
export type SocDecision = (typeof SOC_DECISIONS)[number];
