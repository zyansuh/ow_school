import { z } from 'zod';

/** 선생님 소개 — 성별·지역·출생 연도 */

export const TEACHER_GENDER_OPTIONS = [
  { value: '', label: '선택 안 함' },
  { value: '남', label: '남' },
  { value: '여', label: '여' },
  { value: '기타', label: '기타' },
] as const;

export const TEACHER_GENDER_VALUES = ['남', '여', '기타'] as const;
export type TeacherGender = (typeof TEACHER_GENDER_VALUES)[number];

export const TEACHER_BIRTH_YEAR_MIN = 1970;
export const TEACHER_BIRTH_YEAR_MAX = 2050;

export const TEACHER_BIRTH_YEARS = Array.from(
  { length: TEACHER_BIRTH_YEAR_MAX - TEACHER_BIRTH_YEAR_MIN + 1 },
  (_, i) => TEACHER_BIRTH_YEAR_MIN + i,
);

export type TeacherProfileFields = {
  gender?: string | null;
  region?: string | null;
  birthYear?: number | null;
};

export function teacherProfileMetaLine(teacher: TeacherProfileFields): string | null {
  const parts: string[] = [];
  const gender = teacher.gender?.trim();
  const region = teacher.region?.trim();
  if (gender) parts.push(gender);
  if (region) parts.push(region);
  if (teacher.birthYear != null && teacher.birthYear >= TEACHER_BIRTH_YEAR_MIN) {
    parts.push(`${teacher.birthYear}년생`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export const teacherGenderField = z
  .union([z.enum(TEACHER_GENDER_VALUES), z.literal(''), z.null()])
  .optional()
  .transform((v) => {
    const s = typeof v === 'string' ? v.trim() : v;
    if (!s) return null;
    return TEACHER_GENDER_VALUES.includes(s as TeacherGender) ? (s as TeacherGender) : null;
  });

export const teacherRegionField = z
  .string()
  .max(64)
  .optional()
  .transform((v) => v?.trim() || null);

export const teacherBirthYearField = z
  .union([
    z.number().int().min(TEACHER_BIRTH_YEAR_MIN).max(TEACHER_BIRTH_YEAR_MAX),
    z.null(),
  ])
  .optional();
