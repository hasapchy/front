export const DRIVE_FOLDER_ICON_DEFAULT = "fas fa-folder";

export const DRIVE_FOLDER_ICON_COLOR_DEFAULT = "#EAB308";

export const DRIVE_FOLDER_ICON_COLORS = [
  "#EAB308",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#A855F7",
  "#6366F1",
  "#3B82F6",
  "#14B8A6",
  "#22C55E",
  "#6B7280",
];

/**
 * @param {{ icon?: string|null }|null|undefined} folder
 * @returns {string}
 */
export function driveFolderIconClass(folder) {
  const icon = folder?.icon;
  if (typeof icon === "string" && icon.trim() !== "") {
    return icon.trim();
  }
  return DRIVE_FOLDER_ICON_DEFAULT;
}

/**
 * @param {{ icon_color?: string|null, iconColor?: string|null }|null|undefined} folder
 * @returns {string}
 */
export function driveFolderIconColor(folder) {
  const color = folder?.icon_color ?? folder?.iconColor;
  if (typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color.trim())) {
    return color.trim();
  }
  return DRIVE_FOLDER_ICON_COLOR_DEFAULT;
}
