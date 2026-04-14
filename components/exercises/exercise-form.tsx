"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/lib/i18n/context";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/types/database";
import type { Exercise } from "@/lib/db/queries/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const exerciseSchema = z.object({
  name: z.string().min(1),
  muscle_groups: z.array(z.string()).min(1),
  equipment_id: z.string().optional(),
  instructions: z.string().optional(),
  video_url: z.string().url().optional().or(z.literal("")),
});

export type ExerciseFormValues = z.infer<typeof exerciseSchema>;

interface EquipmentOption {
  id: string;
  name: string;
  icon?: string | null;
}

interface ExerciseFormProps {
  exercise?: Exercise | null;
  equipment: EquipmentOption[];
  onSubmit: (data: ExerciseFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ExerciseForm({ exercise, equipment, onSubmit, onCancel }: ExerciseFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: exercise?.name ?? "",
      muscle_groups: exercise?.muscle_groups ?? [],
      equipment_id: exercise?.equipment_id ?? "",
      instructions: exercise?.instructions ?? "",
      video_url: exercise?.video_url ?? "",
    },
  });

  const selectedMuscles = watch("muscle_groups");

  function toggleMuscle(mg: MuscleGroup) {
    const current = selectedMuscles || [];
    const next = current.includes(mg)
      ? current.filter((m) => m !== mg)
      : [...current, mg];
    setValue("muscle_groups", next, { shouldValidate: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="name"
        label={t.exercises.name}
        error={errors.name?.message}
        {...register("name")}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.exercises.muscleGroups}
        </label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((mg) => {
            const selected = selectedMuscles?.includes(mg);
            return (
              <button
                key={mg}
                type="button"
                onClick={() => toggleMuscle(mg)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {t.muscleGroups[mg]}
              </button>
            );
          })}
        </div>
        {errors.muscle_groups && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.muscle_groups.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="equipment_id"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t.exercises.equipment}
        </label>
        <select
          id="equipment_id"
          {...register("equipment_id")}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">—</option>
          {equipment.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="instructions"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t.exercises.instructions}
        </label>
        <textarea
          id="instructions"
          rows={3}
          {...register("instructions")}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      <Input
        id="video_url"
        label={t.exercises.videoUrl}
        placeholder="https://..."
        error={errors.video_url?.message}
        {...register("video_url")}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isSubmitting}>
          {t.common.save}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}
