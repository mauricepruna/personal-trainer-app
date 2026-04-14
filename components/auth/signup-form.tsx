"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signupAction } from "@/lib/auth/actions";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupValues) {
    setError(null);
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    const result = await signupAction(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <Card className="w-full max-w-sm">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
        {t.auth.signup}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="email"
          type="email"
          label={t.auth.email}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          id="password"
          type="password"
          label={t.auth.password}
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          id="confirmPassword"
          type="password"
          label={t.auth.confirmPassword}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <Button type="submit" loading={isSubmitting} className="w-full">
          {t.auth.signup}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        {t.auth.hasAccount}{" "}
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
          {t.auth.login}
        </Link>
      </p>
    </Card>
  );
}
