import type { UserNickFields } from '@/lib/user-display';

export type TeacherCapacity = {
  id: string;
  currentStudents: number;
  maxStudents: number;
};

export type ClassWithTeachers = {
  slug: string;
  teachers: TeacherCapacity[];
};

export type ClassRef = {
  name: string;
  slug: string;
  gameKr: string;
};

export type TeacherWithClass = {
  id: string;
  name: string;
  intro: string | null;
  currentStudents: number;
  maxStudents: number;
  class: ClassRef;
};

export type TeacherRow = {
  id: string;
  name: string;
  isActive: boolean;
  currentStudents: number;
  maxStudents: number;
  mbti: string | null;
  intro: string | null;
};

export type AssignedStudent = UserNickFields & { id: string };
