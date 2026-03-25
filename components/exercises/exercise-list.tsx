"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import type { ExerciseWithEquipment, EquipmentType, MuscleGroup } from "@/lib/types/database";
import { ExerciseFilters } from "./exercise-filters";
import { ExerciseCard } from "./exercise-card";
import { ExerciseForm, type ExerciseFormValues } from "./exercise-form";
import { Button } from "@/components/ui/button";

interface ExerciseListProps {
  initialExercises: ExerciseWithEquipment[];
  equipment: EquipmentType[];
}

export function ExerciseList({ initialExercises, equipment }: ExerciseListProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [exercises, setExercises] = useState(initialExercises);
  const [searchQuery, setSearchQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "">("");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseWithEquipment | null>(null);

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
    const supabase = createClient();
    const { data: newExercise, error } = await supabase
      .from("exercises")
      .insert({
        name: data.name,
        muscle_groups: data.muscle_groups,
        equipment_id: data.equipment_id || null,
        instructions: data.instructions || null,
        video_url: data.video_url || null,
      })
      .select("*, equipment:equipment_types(*)")
      .single();

    if (error) throw error;
    setExercises((prev) => [...prev, newExercise]);
    setShowForm(false);
    router.refresh();
  }

  async function handleUpdate(data: ExerciseFormValues) {
    if (!editingExercise) return;
    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from("exercises")
      .update({
        name: data.name,
        muscle_groups: data.muscle_groups,
        equipment_id: data.equipment_id || null,
        instructions: data.instructions || null,
        video_url: data.video_url || null,
      })
      .eq("id", editingExercise.id)
      .select("*, equipment:equipment_types(*)")
      .single();

    if (error) throw error;
    setExercises((prev) => prev.map((ex) => (ex.id === updated.id ? updated : ex)));
    setEditingExercise(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(t.exercises.deleteConfirm)) return;
    const supabase = createClient();
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) throw error;
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
    router.refresh();
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
