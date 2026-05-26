export const DEFAULT_WORK_SCHEDULE = Object.freeze({
  1: { enabled: true, start: "09:00", end: "18:00" },
  2: { enabled: true, start: "09:00", end: "18:00" },
  3: { enabled: true, start: "09:00", end: "18:00" },
  4: { enabled: true, start: "09:00", end: "18:00" },
  5: { enabled: true, start: "09:00", end: "18:00" },
  6: { enabled: false, start: "10:00", end: "14:00" },
  7: { enabled: false, start: "00:00", end: "00:00" },
});

export function cloneDefaultWorkSchedule() {
  return cloneWorkSchedule(DEFAULT_WORK_SCHEDULE);
}

/**
 * @param {object|null|undefined} schedule
 * @returns {ReturnType<typeof cloneWorkSchedule>}
 */
export function effectiveWorkSchedule(schedule) {
  return cloneWorkSchedule(schedule ?? DEFAULT_WORK_SCHEDULE);
}

export function cloneWorkSchedule(schedule) {
  const result = {};
  for (let d = 1; d <= 7; d++) {
    const day = schedule?.[d] ?? schedule?.[String(d)];
    const fallback = DEFAULT_WORK_SCHEDULE[d];
    result[d] = day
      ? {
          enabled: Boolean(day.enabled),
          start: String(day.start ?? fallback.start),
          end: String(day.end ?? fallback.end),
        }
      : { ...fallback };
  }
  return result;
}

export function schedulesEqual(a, b) {
  if (!a || !b) {
    return a === b;
  }
  for (let d = 1; d <= 7; d++) {
    const dayA = a[d] ?? a[String(d)];
    const dayB = b[d] ?? b[String(d)];
    if (!dayA || !dayB) {
      if (dayA !== dayB) {
        return false;
      }
      continue;
    }
    if (
      dayA.enabled !== dayB.enabled ||
      dayA.start !== dayB.start ||
      dayA.end !== dayB.end
    ) {
      return false;
    }
  }
  return true;
}
