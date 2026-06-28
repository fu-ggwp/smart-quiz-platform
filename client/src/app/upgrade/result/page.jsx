"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { paymentsService } from "@/services/payments.service";

function payload(response) {
  return response?.data || response || {};
}

function ResultContent() {
  const params = useSearchParams();
  const paymentId = params.get("paymentId");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(paymentId));
  const [error, setError] = useState("");

  async function loadPayment() {
    if (!paymentId) return;
    setLoading(true);
    setError("");

    try {
      setData(payload(await paymentsService.getOne(paymentId)));
    } catch {
      setError("Could not load payment result.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!paymentId) return;
      setLoading(true);
      setError("");

      try {
        const result = payload(await paymentsService.getOne(paymentId));
        if (alive) setData(result);
      } catch {
        if (alive) setError("Could not load payment result.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [paymentId]);

  const state = useMemo(() => {
    const status = data?.payment?.payment_status;
    if (!paymentId) return { icon: AlertCircle, title: "Payment not found", text: "Missing payment reference." };
    if (loading) return { icon: Clock, title: "Checking payment", text: "Please wait while we load the latest payment status." };
    if (error) return { icon: AlertCircle, title: "Result unavailable", text: error };
    if (status === "successful") return { icon: CheckCircle2, title: "Premium activated", text: "Your Premium access is now active." };
    if (status === "cancelled") return { icon: XCircle, title: "Payment cancelled", text: "Premium access was not activated." };
    if (status === "failed") return { icon: XCircle, title: "Payment failed", text: "Premium access was not activated." };
    return { icon: Clock, title: "Payment processing", text: "PayOS has not confirmed this payment yet." };
  }, [data, error, loading, paymentId]);

  const Icon = state.icon;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon aria-hidden="true" />
              {state.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{state.text}</p>
            {data?.subscription?.end_at ? (
              <Alert className="mt-5">
                <CheckCircle2 aria-hidden="true" />
                <AlertTitle>Premium expiration</AlertTitle>
                <AlertDescription>
                  Your access is available until{" "}
                  {new Intl.DateTimeFormat("en", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(data.subscription.end_at))}.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" asChild>
              <Link href="/plans">View plans</Link>
            </Button>
            {paymentId ? <Button onClick={loadPayment}>Check again</Button> : null}
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

export default function UpgradeResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
