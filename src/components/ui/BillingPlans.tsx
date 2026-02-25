"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession } from "@/app/actions/billing";
import { PLAN_LIMITS, type PlanTier } from "@/lib/planLimits";
import StudioCard from "@/components/ui/StudioCard";
import { Check, Loader2 } from "lucide-react";

type CheckoutPlan = "starter" | "pro";

type PlanCard = {
  id: PlanTier;
  name: string;
  priceLabel: string;
  highlights: string[];
};

const PLAN_CARDS: PlanCard[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "0€ / Monat",
    highlights: [
      `${PLAN_LIMITS.free.exhibitions} Projekt`,
      `${PLAN_LIMITS.free.storageMb} MB Speicher`,
      `${PLAN_LIMITS.free.viewsPerMonth.toLocaleString()} Views/Monat`,
    ],
  },
  {
    id: "starter",
    name: "Starter",
    priceLabel: "29€ / Monat",
    highlights: [
      `${PLAN_LIMITS.starter.exhibitions} Projekte`,
      `${PLAN_LIMITS.starter.storageMb} MB Speicher`,
      `${PLAN_LIMITS.starter.viewsPerMonth.toLocaleString()} Views/Monat`,
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "99€ / Monat",
    highlights: [
      `${PLAN_LIMITS.pro.exhibitions} Projekte`,
      `${PLAN_LIMITS.pro.storageMb / 1000} GB Speicher`,
      `${PLAN_LIMITS.pro.viewsPerMonth.toLocaleString()} Views/Monat`,
    ],
  },
];

function isCheckoutPlan(planId: PlanTier): planId is CheckoutPlan {
  return planId === "starter" || planId === "pro";
}

type BillingPlansProps = {
  currentPlan: PlanTier;
};

export default function BillingPlans({ currentPlan }: BillingPlansProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpgrade = (planId: CheckoutPlan) => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await createCheckoutSession(planId);
        window.location.assign(result.url);
      } catch (checkoutError) {
        if (checkoutError instanceof Error && checkoutError.message) {
          setError(checkoutError.message);
          return;
        }

        setError("Could not start Stripe checkout.");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_CARDS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const checkoutPlanId = isCheckoutPlan(plan.id) ? plan.id : null;

          return (
            <StudioCard 
              key={plan.id} 
              className={`p-10 flex flex-col justify-between h-full relative ${
                isCurrentPlan ? 'border-white/20 bg-white/5 ring-1 ring-white/10' : ''
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute top-0 right-0 bg-white text-black text-[10px] font-black px-4 py-1 uppercase tracking-widest rounded-bl-2xl">
                   Aktiv
                </div>
              )}
              
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Plan</p>
                <h4 className="text-3xl font-black tracking-tight text-white mb-4 uppercase">{plan.name}</h4>
                <p className="text-2xl font-light text-zinc-400 mb-10">{plan.priceLabel}</p>

                <ul className="space-y-4 mb-12">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-medium text-zinc-500">
                      <Check size={14} className="text-zinc-700" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                {isCurrentPlan ? (
                  <div className="w-full py-4 text-center rounded-2xl bg-white/5 border border-white/5 text-xs font-black uppercase tracking-widest text-zinc-500">
                    Aktueller Plan
                  </div>
                ) : checkoutPlanId ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpgrade(checkoutPlanId)}
                    className="w-full py-5 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending && <Loader2 size={16} className="animate-spin" />}
                    Upgrade zu {plan.name}
                  </button>
                ) : (
                  <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest text-center px-4">
                    Downgrades werden nach der Kündigung automatisch verarbeitet.
                  </p>
                )}
              </div>
            </StudioCard>
          );
        })}
      </div>

      {error ? (
        <StudioCard className="p-4 bg-red-500/5 border-red-500/20 text-red-500 text-sm font-bold text-center">
          {error}
        </StudioCard>
      ) : null}
    </div>
  );
}
