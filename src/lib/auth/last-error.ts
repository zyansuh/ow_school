/** Auth.js가 클라이언트에 Configuration으로 숨긴 실제 오류(서버 진단용) */

export type LastAuthError = {
  at: string;
  type: string;
  message: string;
  cause?: string;
};

const globalStore = globalThis as typeof globalThis & {
  __owSchoolLastAuthError?: LastAuthError;
};

export function recordAuthError(error: unknown): LastAuthError {
  const err = error as {
    type?: string;
    name?: string;
    message?: string;
    cause?: unknown;
  };
  const cause =
    err.cause instanceof Error
      ? err.cause.message
      : err.cause && typeof err.cause === 'object' && 'err' in (err.cause as object)
        ? String((err.cause as { err?: unknown }).err)
        : err.cause
          ? String(err.cause)
          : undefined;

  const recorded: LastAuthError = {
    at: new Date().toISOString(),
    type: err.type ?? err.name ?? 'Unknown',
    message: (err.message ?? String(error)).slice(0, 500),
    cause: cause?.slice(0, 500),
  };
  globalStore.__owSchoolLastAuthError = recorded;
  return recorded;
}

export function getLastAuthError(): LastAuthError | null {
  return globalStore.__owSchoolLastAuthError ?? null;
}
