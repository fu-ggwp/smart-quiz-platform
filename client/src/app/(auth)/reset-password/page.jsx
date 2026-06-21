"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authService, clearAuthCookie, getCurrentSession } from "@/services/auth.service";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

function getResetMessage(error) {
  const message = error?.message || "";

  if (/session|jwt|expired|invalid/i.test(message)) {
    return "This reset link is invalid or has expired. Please request a new link.";
  }

  if (/password/i.test(message)) {
    return "Please use a stronger password and try again.";
  }

  return "Password reset failed. Please try again.";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formMessage, setFormMessage] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      try {
        const session = await getCurrentSession();

        if (!active) return;
        setHasRecoverySession(Boolean(session?.access_token));
        if (!session?.access_token) {
          setFormMessage(
            "This reset link is invalid or has expired. Please request a new link."
          );
        }
      } catch {
        if (!active) return;
        setHasRecoverySession(false);
        setFormMessage(
          "This reset link is invalid or has expired. Please request a new link."
        );
      } finally {
        if (active) setIsCheckingSession(false);
      }
    }

    checkRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(values) {
    setFormMessage("");

    try {
      await authService.resetPassword({ password: values.password });
      await authService.logout().catch(() => clearAuthCookie());
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setError("password", {
        type: "server",
        message: getResetMessage(error),
      });
      setFormMessage(getResetMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-background p-2 text-foreground md:p-3">
      <section className="flex min-h-[calc(100vh-1rem)] items-center justify-center bg-card px-5 py-10 shadow-sm md:min-h-[calc(100vh-1.5rem)] sm:px-8">
        <div className="w-full max-w-md">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-8 w-fit rounded-full px-2"
          >
            <Link href="/login">
              <ArrowLeft />
              Back to login
            </Link>
          </Button>

          <div className="flex flex-col gap-2 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </span>
            <p className="text-sm font-semibold text-primary">SQP</p>
            <h1 className="text-3xl font-bold leading-tight">Reset password</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Choose a new password for your Smart Quiz Platform account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-6">
            <FieldGroup className="gap-5">
              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.password)}
                    className="h-12 rounded-lg border-border bg-background px-4 pr-11"
                    disabled={isCheckingSession || !hasRecoverySession || isSubmitting}
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isCheckingSession || !hasRecoverySession || isSubmitting}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <FieldError>{errors.password?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.confirmPassword)}>
                <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    className="h-12 rounded-lg border-border bg-background px-4 pr-11"
                    disabled={isCheckingSession || !hasRecoverySession || isSubmitting}
                    {...register("confirmPassword")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    disabled={isCheckingSession || !hasRecoverySession || isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <FieldError>{errors.confirmPassword?.message}</FieldError>
              </Field>
            </FieldGroup>

            <FieldDescription className="text-center text-xs">
              Use at least 8 characters. After saving, sign in again with the new password.
            </FieldDescription>

            {formMessage && (
              <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formMessage}
              </p>
            )}

            {!hasRecoverySession && !isCheckingSession && (
              <Button
                asChild
                type="button"
                variant="secondary"
                size="lg"
                className="h-12 w-full rounded-full"
              >
                <Link href="/forgot-password">Request a new reset link</Link>
              </Button>
            )}

            <Button
              type="submit"
              size="lg"
              className="h-14 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isCheckingSession || !hasRecoverySession || isSubmitting}
            >
              {isCheckingSession
                ? "Checking link..."
                : isSubmitting
                  ? "Saving..."
                  : "Save new password"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}