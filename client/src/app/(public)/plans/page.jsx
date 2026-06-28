"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentsService } from "@/services/payments.service";
import { useAuthStore } from "@/stores/auth-store";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function getPlansPayload(response) {
  return response?.data || response || {};
}

function formatPrice(price) {
  return currencyFormatter.format(Number(price) || 0);
}

function formatDuration(plan) {
  if (plan?.billing_period === "monthly") return "Monthly";
  if (plan?.duration_days) return `${plan.duration_days} days`;
  return "Premium access";
}

function formatAccessPeriod(plan) {
  return plan?.duration_days
    ? `${formatDuration(plan)} - ${plan.duration_days} days`
    : formatDuration(plan);
}

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function PlanSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1].map((item) => (
        <Card key={item} className="min-h-[360px]">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-10 w-32" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function PlanFeatureList({ features }) {
  if (!features?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Premium learning benefits are included with this plan.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {features.map((feature) => (
        <li key={feature.feature_code} className="flex gap-3">
          <CheckCircle2
            data-icon="inline-start"
            className="mt-0.5 text-primary"
            aria-hidden="true"
          />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-foreground">
              {feature.feature_name}
            </span>
            {feature.description ? (
              <span className="text-sm leading-6 text-muted-foreground">
                {feature.description}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlanAction({
  plan,
  isAuthenticated,
  authLoading,
  currentSubscription,
}) {
  const isCurrentPlan =
    currentSubscription?.premium_plan_id === plan.premium_plan_id;

  if (isCurrentPlan) {
    return (
      <Button className="w-full" disabled>
        Current plan
      </Button>
    );
  }

  if (authLoading) {
    return (
      <Button className="w-full" disabled>
        Checking account
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button asChild className="w-full">
        <Link href="/login?next=/plans">Login to select</Link>
      </Button>
    );
  }

  return (
    <Button asChild className="w-full">
      <Link href={`/upgrade?planId=${plan.premium_plan_id}`}>Upgrade plan</Link>
    </Button>
  );
}

function PlanCard({ plan, isAuthenticated, authLoading, currentSubscription }) {
  const title = plan.display_name || plan.plan_name || "Premium Plan";

  return (
    <Card className="min-h-[430px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {plan.description || formatDuration(plan)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="text-3xl font-semibold tracking-normal">
            {formatPrice(plan.price_vnd)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatAccessPeriod(plan)}
          </div>
        </div>

        <Separator />

        <PlanFeatureList features={plan.features} />
      </CardContent>

      <CardFooter>
        <PlanAction
          plan={plan}
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          currentSubscription={currentSubscription}
        />
      </CardFooter>
    </Card>
  );
}

export default function PlansPage() {
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPlans() {
      setLoading(true);
      setError("");

      try {
        const response = await paymentsService.listPlans();
        const payload = getPlansPayload(response);

        if (!isMounted) return;

        setPlans(Array.isArray(payload.plans) ? payload.plans : []);
        setCurrentSubscription(payload.currentSubscription || null);
      } catch {
        if (!isMounted) return;
        setError("Could not load premium plans. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentPlanName = useMemo(() => {
    if (!currentSubscription) return "";
    return (
      currentSubscription.display_name ||
      currentSubscription.plan_name ||
      "Premium"
    );
  }, [currentSubscription]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-0 flex w-full max-w-[min(22rem,calc(100vw-2rem))] flex-col gap-8 sm:mx-auto sm:max-w-6xl">
        <div className="flex max-w-3xl flex-col gap-3">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Premium Plans
          </h1>
        </div>

        {currentSubscription ? (
          <Alert>
            <CheckCircle2 aria-hidden="true" />
            <AlertTitle>{currentPlanName} is active</AlertTitle>
            <AlertDescription>
              Your premium access is available until{" "}
              {formatDate(currentSubscription.end_at)}.
            </AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Plans unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? <PlanSkeleton /> : null}

        {!loading && !error && plans.length === 0 ? (
          <Alert>
            <AlertCircle aria-hidden="true" />
            <AlertTitle>No active premium plans</AlertTitle>
            <AlertDescription>
              Premium plans are not available right now.
            </AlertDescription>
          </Alert>
        ) : null}

        {!loading && !error && plans.length > 0 ? (
          <div className="flex gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.premium_plan_id}
                plan={plan}
                isAuthenticated={isAuthenticated}
                authLoading={authLoading}
                currentSubscription={currentSubscription}
              />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
