"use client";

import { useState, useTransition } from "react";

import { createCheckoutSession } from "@/app/actions/billing";
import { PLAN_LIMITS, type PlanTier } from "@/lib/planLimits";

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
    priceLabel: "0EUR / month",
    highlights: [
      `${PLAN_LIMITS.free.exhibitions} exhibition`,
      `${PLAN_LIMITS.free.storageMb} MB storage`,
      `${PLAN_LIMITS.free.viewsPerMonth} views/month`,
    ],
  },
  {
    id: "starter",
    name: "Starter",
    priceLabel: "29EUR / month",
    highlights: [
      `${PLAN_LIMITS.starter.exhibitions} exhibitions`,
      `${PLAN_LIMITS.starter.storageMb} MB storage`,
      `${PLAN_LIMITS.starter.viewsPerMonth} views/month`,
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "99EUR / month",
    highlights: [
      `${PLAN_LIMITS.pro.exhibitions} exhibitions`,
      `${PLAN_LIMITS.pro.storageMb / 1000} GB storage`,
      `${PLAN_LIMITS.pro.viewsPerMonth} views/month`,
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
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_CARDS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const checkoutPlanId = isCheckoutPlan(plan.id) ? plan.id : null;

          return (
            <article
              key={plan.id}
              className={`rounded-2xl border p-5 backdrop-blur-xl ${isCurrentPlan
                ? "border-cyan-200/50 bg-cyan-300/15"
                : "border-white/15 bg-white/8"
                }`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">
                {plan.name}
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{plan.priceLabel}</p>

              <ul className="mt-4 space-y-2 text-sm text-white/75">
                {plan.highlights.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrentPlan ? (
                  <p className="inline-flex rounded-lg border border-emerald-200/40 bg-emerald-300/15 px-3 py-2 text-xs font-medium text-emerald-50">
                    Current plan
                  </p>
                ) : checkoutPlanId ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleUpgrade(checkoutPlanId)}
                    className="rounded-lg border border-cyan-200/40 bg-cyan-300/20 px-3 py-2 text-xs font-medium text-cyan-50 transition hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Redirecting..." : `Upgrade to ${plan.name}`}
                  </button>
                ) : (
                  <p className="text-xs text-white/60">
                    Downgrades are handled automatically after cancellation.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
