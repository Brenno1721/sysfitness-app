import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { PLANS, PlanId, PlanFeatures, Plan } from '../lib/plans';

const planStorageKey = (userId: string) => `app:plan:${userId}`;
const DEFAULT_PLAN_ID: PlanId = 'free';

type PlanContextValue = {
  planId: PlanId;
  plan: Plan;
  setPlan: (id: PlanId) => void;
  hasFeature: <K extends keyof PlanFeatures>(key: K) => PlanFeatures[K];
};

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [planId, setPlanIdState] = useState<PlanId>(DEFAULT_PLAN_ID);

  // Troca de conta: recarrega o plano da conta atual (default 'free' se essa
  // conta nunca teve plano salvo) — sem isso o plano da conta anterior "vaza".
  useEffect(() => {
    if (!userId) {
      setPlanIdState(DEFAULT_PLAN_ID);
      return;
    }
    setPlanIdState(DEFAULT_PLAN_ID);
    AsyncStorage.getItem(planStorageKey(userId)).then((raw) => {
      if (raw && raw in PLANS) setPlanIdState(raw as PlanId);
    });
  }, [userId]);

  // Simulação de assinatura: por enquanto só troca o estado local, sem cobrança
  // real nenhuma — quando o RevenueCat entrar, isso vira o callback de sucesso
  // da compra em vez de ser chamado direto pela UI.
  const setPlan = useCallback(
    (id: PlanId) => {
      if (!userId) return;
      setPlanIdState(id);
      AsyncStorage.setItem(planStorageKey(userId), id);
    },
    [userId]
  );

  const hasFeature = useCallback(
    <K extends keyof PlanFeatures>(key: K): PlanFeatures[K] => PLANS[planId].features[key],
    [planId]
  );

  return (
    <PlanContext.Provider value={{ planId, plan: PLANS[planId], setPlan, hasFeature }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan precisa estar dentro de <PlanProvider>');
  return ctx;
}
