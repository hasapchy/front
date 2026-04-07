function cloneValue(value) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return structuredClone(value);
  }
  return value;
}

export function fillFromBase(local, base) {
  const out = { ...local };
  for (const key of Object.keys(base)) {
    if (!(key in out)) {
      out[key] = cloneValue(base[key]);
      continue;
    }
    const left = out[key];
    const right = base[key];
    if (
      left !== null &&
      typeof left === 'object' &&
      !Array.isArray(left) &&
      right !== null &&
      typeof right === 'object' &&
      !Array.isArray(right)
    ) {
      out[key] = fillFromBase(left, right);
    }
  }
  return out;
}
