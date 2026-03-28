function toSnakeKey(key) {
  return String(key).replace(/([A-Z])/g, "_$1").toLowerCase();
}

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

function shouldSkipTransform(value) {
  return (
    value instanceof Date ||
    value instanceof FormData ||
    value instanceof Blob ||
    value instanceof File ||
    value instanceof URLSearchParams
  );
}

export function toSnakeCaseDeep(value) {
  if (value == null) return value;
  if (shouldSkipTransform(value)) return value;

  if (Array.isArray(value)) {
    return value.map((item) => toSnakeCaseDeep(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const result = {};
  Object.keys(value).forEach((key) => {
    const nextKey = toSnakeKey(key);
    result[nextKey] = toSnakeCaseDeep(value[key]);
  });
  return result;
}
