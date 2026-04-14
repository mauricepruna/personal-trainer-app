"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createExerciseAction, updateExerciseAction, deleteExerciseAction } from "@/lib/actions/exercises";
import type { Exercise } from "@/lib/db/queries/exercises";
import type { MuscleGroup } from "@/lib/types/database";
import { ExerciseFilters } from "./exercise-filters";
import { ExerciseCard } from "./exercise-card";
import { ExerciseForm, type ExerciseFormValues } from "./exercise-form";
import { Button } from "@/components/ui/button";

interface EquipmentOption {
  id: string;
  name: string;
  icon: string | null;
}

interface ExerciseListProps {
  initialExercises: Exercise[];
  equipment: EquipmentOption[];
}

export function ExerciseList({ initialExercises, equipment }: ExerciseListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [exercises, setExercises] = useState(initialExercises);
  const [searchQuery, setSearchQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "">("");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (searchQuery && !ex.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (muscleFilter && !ex.muscle_groups.includes(muscleFilter)) {
        return false;
      }
      if (equipmentFilter && ex.equipment_id !== equipmentFilter) {
        return false;
      }
      return true;
    });
  }, [exercises, searchQuery, muscleFilter, equipmentFilter]);

  async function handleCreate(data: ExerciseFormValues) {
    const formData = new FormData();
    formData.set("name", data.name);
    data.muscle_groups.forEach((mg) => formData.append("muscle_groups", mg));
    if (data.equipment_id) formData.set("equipment_id", data.equipment_id);
    if (data.instructions) formData.set("instructions", data.instructions);
    if (data.video_url) formData.set("video_url", data.video_url);
    await createExerciseAction(formData);
    router.refresh();
    setShowForm(false);
  }

  async function handleUpdate(data: ExerciseFormValues) {
    if (!editingExercise) return;
    const formData = new FormData();
    formData.set("id", editingExercise.id);
    formData.set("name", data.name);
    data.muscle_groups.forEach((mg) => formData.append("muscle_groups", mg));
    if (data.equipment_id) formData.set("equipment_id", data.equipment_id);
    if (data.instructions) formData.set("instructions", data.instructions);
    if (data.video_url) formData.set("video_url", data.video_url);
    await updateExerciseAction(formData);
    router.refresh();
    setEditingExercise(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(t.exercises.deleteConfirm)) return;
    await deleteExerciseAction(id);
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }

  if (showForm || editingExercise) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {editingExercise ? t.exercises.editExercise : t.exercises.addExercise}
        </h2>
        <ExerciseForm
          exercise={editingExercise}
          equipment={equipment}
          onSubmit={editingExercise ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingExercise(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.exercises.title}
        </h1>
        <Button onClick={() => setShowForm(true)} size="sm">
          + {t.exercises.addExercise}
        </Button>
      </div>

      <ExerciseFilters
        muscleFilter={muscleFilter}
        equipmentFilter={equipmentFilter}
        searchQuery={searchQuery}
        equipment={equipment}
        onMuscleChange={setMuscleFilter}
        onEquipmentChange={setEquipmentFilter}
        onSearchChange={setSearchQuery}
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">
          {exercises.length === 0 ? t.exercises.noExercises : t.common.noResults}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={setEditingExercise}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
