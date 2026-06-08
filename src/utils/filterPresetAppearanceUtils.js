/**
 * @param {{ icon?: string, color?: string }|null|undefined} preset
 * @returns {{ icon: string|null, color: string|null }}
 */
export function resolveFilterPresetAppearance(preset) {
  return {
    icon: preset?.icon ?? null,
    color: preset?.color ?? null,
  };
}

/**
 * @param {{ icon?: string, color?: string }|null|undefined} preset
 * @returns {boolean}
 */
export function hasFilterPresetAppearance(preset) {
  const { icon, color } = resolveFilterPresetAppearance(preset);
  return Boolean(icon && color);
}

/**
 * @param {string} color
 * @returns {string}
 */
export function buildFilterPresetButtonStyle(color) {
  return [
    `border-color: ${color}`,
    `background-color: color-mix(in srgb, ${color} 12%, white)`,
  ].join('; ');
}
