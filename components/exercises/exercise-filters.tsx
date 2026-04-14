"use client";

import { useTranslation } from "@/lib/i18n/context";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/types/database";

interface EquipmentOption {
  id: string;
  name: string;
}

interface ExerciseFiltersProps {
  muscleFilter: MuscleGroup | "";
  equipmentFilter: string;
  searchQuery: string;
  equipment: EquipmentOption[];
  onMuscleChange: (value: MuscleGroup | "") => void;
  onEquipmentChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function ExerciseFilters({
  muscleFilter,
  equipmentFilter,
  searchQuery,
  equipment,
  onMuscleChange,
  onEquipmentChange,
  onSearchChange,
}: ExerciseFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        placeholder={t.common.search + "..."}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
      />
      <select
        value={muscleFilter}
        onChange={(e) => onMuscleChange(e.target.value as MuscleGroup | "")}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      >
        <option value="">{t.exercises.allMuscles}</option>
        {MUSCLE_GROUPS.map((mg) => (
          <option key={mg} value={mg}>
            {t.muscleGroups[mg]}
          </option>
        ))}
      </select>
      <select
        value={equipmentFilter}
        onChange={(e) => onEquipmentChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      >
        <option value="">{t.exercises.allEquipment}</option>
        {equipment.map((eq) => (
          <option key={eq.id} value={eq.id}>
            {eq.name}
          </option>
        ))}
      </select>
    </div>
  );
}
