"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { loginAccount } from "@/services/auth";

const heroImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1100&q=80";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
  rememberMe: z.boolean().optional(),
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

export default function LoginPage() {
  const router = useRouter();
  const [formMessage, setFormMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
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
      const response = await loginAccount(values);
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
              <Link href="/register" className="pb-2 text-muted-foreground">
                Register
              </Link>
              <Link
                href="/login"
                className="border-b-4 border-primary pb-2 text-foreground"
              >
                Login
              </Link>
            </div>

            <div className="mt-8 flex flex-col gap-7">
              <div className="flex flex-col gap-2 text-center md:hidden">
                <p className="text-sm font-semibold text-primary">SQP</p>
                <h1 className="text-3xl font-bold leading-tight">
                  Welcome back
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
                Login with Google
              </Button>

              <FieldSeparator>or email</FieldSeparator>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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

                  <Field data-invalid={Boolean(errors.password)}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
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

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <Controller
                      control={control}
                      name="rememberMe"
                      render={({ field }) => (
                        <label className="flex items-center gap-2 text-muted-foreground">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(Boolean(checked))
                            }
                          />
                          Remember me
                        </label>
                      )}
                    />
                    <Link
                      href="/forgot-password"
                      className="font-semibold text-primary hover:underline"
                    >
                      Forgot password
                    </Link>
                  </div>
                </FieldGroup>

                <FieldDescription className="text-center text-xs">
                  By logging in, you agree to the platform terms and privacy
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
                  {isSubmitting ? "Please wait..." : "Login"}
                </Button>

                <Button
                  asChild
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="h-12 w-full rounded-full"
                >
                  <Link href="/register">
                    New to Smart Quiz Platform? Create account
                  </Link>
                </Button>
              </form>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
