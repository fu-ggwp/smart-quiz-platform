"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import supabase from "@/lib/supabaseClient";
import { registerAccount } from "@/services/auth";

const heroImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1100&q=80";

const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Please enter your full name."),
    username: z
      .string()
      .trim()
      .regex(
        /^[a-zA-Z0-9_]{3,30}$/,
        "Use 3-30 letters, numbers, or underscores."
      ),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

function getApiMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

async function persistSupabaseSession(session) {
  if (!session?.access_token || !session?.refresh_token) return;

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) throw error;
}

function GoogleMark() {
  return (
    <span className="grid size-5 place-items-center rounded-full bg-background text-xs font-semibold text-primary">
      G
    </span>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [formMessage, setFormMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function handleGoogleLogin() {
    setFormMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) setFormMessage(error.message);
  }

  async function onSubmit(values) {
    setFormMessage("");

    try {
      const response = await registerAccount(values);
      await persistSupabaseSession(response?.session);
      router.push("/");
      router.refresh();
    } catch (error) {
      const fields = error?.response?.data?.fields || {};

      Object.entries(fields).forEach(([name, message]) => {
        setError(name, { type: "server", message });
      });
      setFormMessage(getApiMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-background p-2 text-foreground md:p-3">
      <section className="grid min-h-[calc(100vh-1rem)] overflow-hidden rounded-none bg-card shadow-sm md:min-h-[calc(100vh-1.5rem)] md:grid-cols-[minmax(330px,0.95fr)_1fr]">
        <aside className="relative hidden overflow-hidden bg-auth-panel md:block">
          <div className="absolute left-10 top-9 z-10 max-w-sm">
            <h1 className="text-5xl font-bold leading-[1.12] text-auth-panel-foreground">
              Study better,
              <br />
              without the
              <br />
              pressure.
            </h1>
          </div>
          <Image
            src={heroImage}
            alt="Student using a laptop"
            fill
            priority
            sizes="42vw"
            className="object-cover object-center pl-[32%] pt-[24%]"
          />
          <div className="absolute bottom-9 left-10 z-10 text-3xl font-bold text-primary-foreground">
            SQP
          </div>
        </aside>

        <section className="relative flex items-center justify-center px-5 py-10 sm:px-8">
          <Button
            asChild
            variant="secondary"
            size="icon-lg"
            className="absolute right-5 top-5 rounded-full"
            aria-label="Close"
          >
            <Link href="/">
              <X />
            </Link>
          </Button>

          <div className="w-full max-w-xl">
            <div className="mx-auto flex w-fit items-center gap-8 text-base font-semibold">
              <Link
                href="/register"
                className="border-b-4 border-primary pb-2 text-foreground"
              >
                Register
              </Link>
              <Link href="/login" className="pb-2 text-muted-foreground">
                Login
              </Link>
            </div>

            <div className="mt-8 flex flex-col gap-7">
              <div className="flex flex-col gap-2 text-center md:hidden">
                <p className="text-sm font-semibold text-primary">SQP</p>
                <h1 className="text-3xl font-bold leading-tight">
                  Create your account
                </h1>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="h-12 w-full rounded-full"
                onClick={handleGoogleLogin}
              >
                <GoogleMark />
                Register with Google
              </Button>

              <FieldSeparator>or email</FieldSeparator>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <FieldGroup className="gap-5">
                  <Field data-invalid={Boolean(errors.fullName)}>
                    <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      aria-invalid={Boolean(errors.fullName)}
                      className="h-12 rounded-lg border-border bg-background px-4"
                      {...register("fullName")}
                    />
                    <FieldError>{errors.fullName?.message}</FieldError>
                  </Field>

                  <Field data-invalid={Boolean(errors.username)}>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      autoComplete="username"
                      aria-invalid={Boolean(errors.username)}
                      className="h-12 rounded-lg border-border bg-background px-4"
                      {...register("username")}
                    />
                    <FieldError>{errors.username?.message}</FieldError>
                  </Field>

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

                  <Field data-invalid={Boolean(errors.password)}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.password)}
                        className="h-12 rounded-lg border-border bg-background px-4 pr-11"
                        {...register("password")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                    <FieldError>{errors.password?.message}</FieldError>
                  </Field>

                  <Field data-invalid={Boolean(errors.confirmPassword)}>
                    <FieldLabel htmlFor="confirmPassword">
                      Confirm password
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.confirmPassword)}
                        className="h-12 rounded-lg border-border bg-background px-4 pr-11"
                        {...register("confirmPassword")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                        onClick={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                        aria-label={
                          showConfirmPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                    <FieldError>{errors.confirmPassword?.message}</FieldError>
                  </Field>
                </FieldGroup>

                <FieldDescription className="text-center text-xs">
                  By registering, you agree to the platform terms and privacy
                  policy.
                </FieldDescription>

                {formMessage && (
                  <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {formMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-lg bg-auth-action text-auth-action-foreground hover:bg-auth-action/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Please wait..." : "Create account"}
                </Button>

                <Button
                  asChild
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="h-12 w-full rounded-full"
                >
                  <Link href="/login">Already have an account? Login</Link>
                </Button>
              </form>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
