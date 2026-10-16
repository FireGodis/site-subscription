export const plans = {
  essencial: { name: "Essencial", price: 19, limit: 5, mpReason: "Fechou Essencial — mensal" },
  pro: { name: "Pro", price: 39, limit: 50, mpReason: "Fechou Pro — mensal" },
  estudio: { name: "Estúdio", price: 79, limit: 200, mpReason: "Fechou Estúdio — mensal" }
} as const;

export type PlanId = keyof typeof plans;
