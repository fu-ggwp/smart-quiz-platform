"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth.service";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

const SUCCESS_MESSAGE =
  "We have sent an email to this email address. Please check your email.";

function getResetRedirectUrl() {
  if (typeof window === "undefined") return undefined;

  return `${window.location.origin}/reset-password`;
}

export default function ForgotPasswordPage() {
  const [formMessage, setFormMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values) {
    setFormMessage("");
    setIsSuccess(false);

    try {
      await authService.forgotPassword(values.email, getResetRedirectUrl());
      setIsSuccess(true);
      setFormMessage(SUCCESS_MESSAGE);
    } catch {
      setIsSuccess(true);
      setFormMessage(SUCCESS_MESSAGE);
    }
  }

  return (
    <main className="min-h-screen bg-background p-2 text-foreground md:p-3">
      <section className="flex min-h-[calc(100vh-1rem)] items-center justify-center bg-card px-5 py-10 shadow-sm md:min-h-[calc(100vh-1.5rem)] sm:px-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-bold leading-tight">
              Forgot password
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Enter your email and we will send instructions to reset your
              password.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 flex flex-col gap-6"
          >
            <FieldGroup className="gap-5">
              <Field data-invalid={Boolean(errors.email)}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  className="h-12 rounded-lg border-border bg-background px-4"
                  {...register("email")}
                />
                <FieldError>{errors.email?.message}</FieldError>
              </Field>
            </FieldGroup>

            {formMessage && (
              <p
                className={
                  isSuccess
                    ? "rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary"
                    : "rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
                }
              >
                {formMessage}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="h-14 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
