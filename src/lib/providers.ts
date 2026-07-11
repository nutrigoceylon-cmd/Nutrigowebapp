import type { ProviderSpecialty } from '../types'

export const providerSpecialties: { value: ProviderSpecialty; label: string }[] = [
  { value: 'dietician', label: 'Dietician' },
  { value: 'ayurvedic_consultant', label: 'Ayurvedic consultant' },
  { value: 'consultant_in_clinical_nutrition', label: 'Consultant in Clinical nutrition' },
  { value: 'fitness_instructor', label: 'Fitness instructor' },
  { value: 'yoga_instructor', label: 'Yoga instructor' },
]

const legacySpecialtyMap: Record<string, ProviderSpecialty> = {
  nutritionist: 'dietician',
  ayurvedic_doctor: 'ayurvedic_consultant',
  western_doctor: 'consultant_in_clinical_nutrition',
}

export const providerSpecialtyLabels: Record<string, string> = {
  dietician: 'Dietician',
  ayurvedic_consultant: 'Ayurvedic consultant',
  consultant_in_clinical_nutrition: 'Consultant in Clinical nutrition',
  fitness_instructor: 'Fitness instructor',
  yoga_instructor: 'Yoga instructor',
}

export const providerSpecialtyColors: Record<string, string> = {
  dietician: 'bg-emerald-100 text-emerald-800',
  ayurvedic_consultant: 'bg-amber-100 text-amber-800',
  consultant_in_clinical_nutrition: 'bg-sky-100 text-sky-800',
  fitness_instructor: 'bg-rose-100 text-rose-800',
  yoga_instructor: 'bg-fuchsia-100 text-fuchsia-800',
}

export function normalizeProviderSpecialty(value: string): ProviderSpecialty {
  return legacySpecialtyMap[value] ?? value
}

export function getProviderSpecialtyLabel(value: string): string {
  const normalized = normalizeProviderSpecialty(value)
  return providerSpecialtyLabels[normalized] ?? normalized
}
