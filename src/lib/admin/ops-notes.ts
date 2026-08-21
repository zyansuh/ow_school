import { prisma } from '@/lib/prisma';
import { ADMIN_CLASS_NAMES } from '@/lib/admin/class-filter';

export const OPS_NOTES_KEY = 'admin_ops_notes';

export type OpsNotesPayload = {
  classes: Record<string, string>;
  teachers: Record<string, string>;
};

const EMPTY: OpsNotesPayload = { classes: {}, teachers: {} };

export async function loadOpsNotes(): Promise<OpsNotesPayload> {
  const row = await prisma.siteSetting.findUnique({ where: { key: OPS_NOTES_KEY } });
  if (!row?.value) return { ...EMPTY, classes: {}, teachers: {} };
  try {
    const parsed = JSON.parse(row.value) as OpsNotesPayload;
    return {
      classes: parsed.classes && typeof parsed.classes === 'object' ? parsed.classes : {},
      teachers: parsed.teachers && typeof parsed.teachers === 'object' ? parsed.teachers : {},
    };
  } catch {
    return { classes: {}, teachers: {} };
  }
}

export async function saveOpsNotes(notes: OpsNotesPayload) {
  const classes: Record<string, string> = {};
  for (const name of ADMIN_CLASS_NAMES) {
    const v = (notes.classes[name] ?? '').trim().slice(0, 120);
    if (v) classes[name] = v;
  }
  // keep any extra class keys that were set
  for (const [k, v] of Object.entries(notes.classes ?? {})) {
    const t = v.trim().slice(0, 120);
    if (t) classes[k] = t;
  }
  const teachers: Record<string, string> = {};
  for (const [id, v] of Object.entries(notes.teachers ?? {})) {
    const t = v.trim().slice(0, 120);
    if (t) teachers[id] = t;
  }
  const payload = { classes, teachers };
  await prisma.siteSetting.upsert({
    where: { key: OPS_NOTES_KEY },
    create: { key: OPS_NOTES_KEY, value: JSON.stringify(payload) },
    update: { value: JSON.stringify(payload) },
  });
  return payload;
}
