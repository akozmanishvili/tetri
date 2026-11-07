import { createContext, useContext, useEffect } from "react";

export type TamadaConcept =
  | "welcome"
  | "nav"
  | "fx"
  | "fees"
  | "first_order"
  | "pending_order"
  | "diversification"
  | "first_loss";

type TamadaContextValue = {
  unlock: (concept: TamadaConcept) => void;
};

export const TamadaContext = createContext<TamadaContextValue | null>(null);

export function useTamadaContext() {
  const ctx = useContext(TamadaContext);
  if (!ctx)
    throw new Error("useTamadaContext must be used inside <TamadaProvider>");
  return ctx;
}

export function useTamada(concept: TamadaConcept, when = true) {
  const { unlock } = useTamadaContext();
  useEffect(() => {
    if (when) unlock(concept);
  }, [concept, when, unlock]);
}
