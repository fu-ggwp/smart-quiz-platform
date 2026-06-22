"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import supabase from "@/lib/supabaseClient";
import { authService, syncAuthCookie } from "@/services/auth.service";

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

function getProviders(user) {
  const providers = user?.app_metadata?.providers;
  return Array.isArray(providers) ? providers : [];
}

function getPasswordMessage(error) {
  const message = error?.message || "";

  if (/invalid login credentials/i.test(message)) {
    return "Current password is incorrect. Please try again.";
  }

  if (/session|jwt|expired|invalid/i.test(message)) {
    return "Your session has expired. Please log in again.";
  }

  if (/password/i.test(message)) {
    return "Please use a stronger password and try again.";
  }

  return "Password could not be updated. Please check and try again.";
}

function PasswordInput({
  autoComplete,
  disabled,
  error,
  id,
  label,
  placeholder,
  register,
  showPassword,
  togglePassword,
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className="h-12 rounded-lg border-border bg-background px-4 pr-11"
          disabled={disabled}
          {...register(id)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
          onClick={togglePassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
          disabled={disabled}
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      <FieldError>{error?.message}</FieldError>
    </Field>
  );
}

export default function ChangePasswordPage() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("loading");
  const [formMessage, setFormMessage] = useState("");
  const [messageTone, setMessageTone] = useState("error");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let active = true;

    async function loadAuthMode() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (!active) return;

        const user = data?.user;
        const providers = getProviders(user);

        setEmail(user?.email || "");
        setMode(providers.includes("email") ? "change" : "set");
      } catch {
        if (!active) return;
        setMode("error");
        setMessageTone("error");
        setFormMessage("Your session has expired. Please log in again.");
      }
    }

    loadAuthMode();

    return () => {
      active = false;
    };
  }, []);

  const isLoading = mode === "loading";
  const isSetMode = mode === "set";
  const isDisabled = isLoading || mode === "error" || isSubmitting;

  async function refreshAuthMode() {
    const { data } = await supabase.auth.getUser();
    const providers = getProviders(data?.user);

    if (providers.includes("email")) {
      setMode("change");
    }
  }

  async function onSubmit(values) {
    setFormMessage("");
    setMessageTone("error");

    if (mode === "change" && !values.currentPassword) {
      setError("currentPassword", {
        type: "manual",
        message: "Please enter your current password.",
      });
      return;
    }

    try {
      if (mode === "change") {
        const response = await authService.changePassword({
          email,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        syncAuthCookie(response?.session);
      } else {
        await authService.setPassword({ newPassword: values.newPassword });
      }

      reset();
      await refreshAuthMode();
      setMessageTone("success");
      setFormMessage(
        isSetMode
          ? "Your password has been set successfully."
          : "Your password has been updated successfully.",
      );
    } catch (error) {
      const message = getPasswordMessage(error);
      const targetField = /current password|credentials/i.test(message)
        ? "currentPassword"
        : "newPassword";

      setError(targetField, { type: "server", message });
      setFormMessage(message);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-fit rounded-full px-2"
        >
          <Link href="/profile">
            <ArrowLeft />
            Back to profile
          </Link>
        </Button>

        <div className="grid gap-6 lg:w-1/2 lg:mx-auto lg:items-start">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"
          >
            <FieldGroup className="gap-5">
              {mode === "change" ? (
                <PasswordInput
                  id="currentPassword"
                  label="Current password"
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  disabled={isDisabled}
                  error={errors.currentPassword}
                  register={register}
                  showPassword={showCurrentPassword}
                  togglePassword={() =>
                    setShowCurrentPassword((current) => !current)
                  }
                />
              ) : null}

              <PasswordInput
                id="newPassword"
                label="New password"
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={isDisabled}
                error={errors.newPassword}
                register={register}
                showPassword={showNewPassword}
                togglePassword={() => setShowNewPassword((current) => !current)}
              />

              <PasswordInput
                id="confirmPassword"
                label="Confirm password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={isDisabled}
                error={errors.confirmPassword}
                register={register}
                showPassword={showConfirmPassword}
                togglePassword={() =>
                  setShowConfirmPassword((current) => !current)
                }
              />
            </FieldGroup>

            <FieldDescription className="mt-5 text-xs">
              Use at least 8 characters.
            </FieldDescription>

            {formMessage ? (
              <p
                className={
                  messageTone === "success"
                    ? "mt-5 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary"
                    : "mt-5 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
                }
              >
                {formMessage}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="mt-6 h-12 w-full rounded-lg"
              disabled={isDisabled}
            >
              {isLoading
                ? "Checking account..."
                : isSubmitting
                  ? "Saving..."
                  : isSetMode
                    ? "Set password"
                    : "Change password"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
