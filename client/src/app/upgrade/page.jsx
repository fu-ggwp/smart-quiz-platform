"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { paymentsService } from "@/services/payments.service";
import { useAuthStore } from "@/stores/auth-store";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function payload(response) {
  return response?.data || response || {};
}

function UpgradeContent() {
  const params = useSearchParams();
  const planId = params.get("planId");
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const [plan, setPlan] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadPlan() {
      setLoading(true);
      setError("");

      try {
        const data = payload(await paymentsService.listPlans());
        const selected = (data.plans || []).find((item) => item.premium_plan_id === planId);
        if (!alive) return;
        setPlan(selected || null);
        if (!selected) setError("Selected premium plan is unavailable.");
      } catch {
        if (alive) setError("Could not load premium plan.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadPlan();
    return () => {
      alive = false;
    };
  }, [planId]);

  const title = useMemo(() => plan?.display_name || plan?.plan_name || "Premium plan", [plan]);

  async function startCheckout() {
    setSubmitting(true);
    setError("");

    try {
      const data = payload(await paymentsService.startCheckout(plan.premium_plan_id));
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err?.response?.data?.error || "Could not start payment. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold leading-tight">Upgrade to Premium</h1>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Upgrade unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!authLoading && !isAuthenticated ? (
          <Alert>
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Login required</AlertTitle>
            <AlertDescription>
              Please login before upgrading your account.
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{loading ? "Loading plan" : title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {plan ? (
              <>
                <div className="flex flex-col gap-1">
                  <div className="text-3xl font-semibold tracking-normal">
                    {money.format(Number(plan.price_vnd) || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.duration_days} days of Premium access
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <Checkbox
                    id="terms"
                    checked={accepted}
                    onCheckedChange={(value) => setAccepted(Boolean(value))}
                  />
                  <label htmlFor="terms" className="text-sm leading-6">
                    I agree to activate Premium after PayOS confirms a successful
                    payment.
                  </label>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading selected plan..." : "No plan selected."}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" asChild>
              <Link href="/plans">Back to plans</Link>
            </Button>
            {!isAuthenticated ? (
              <Button asChild>
                <Link href={`/login?next=${encodeURIComponent(`/upgrade?planId=${planId || ""}`)}`}>
                  Login
                </Link>
              </Button>
            ) : (
              <Button
                disabled={!plan || !accepted || submitting}
                onClick={startCheckout}
              >
                {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
                Proceed to payment
              </Button>
            )}
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  );
}
