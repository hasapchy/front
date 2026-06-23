import DriveController from "@/api/DriveController";
import {
  DRIVE_ALLOWED_EXTENSIONS,
  DRIVE_BROWSER_VIEW_EXTENSIONS,
  DRIVE_IMAGE_EXTENSIONS,
} from "@/constants/driveAllowedExtensions";
import {
  DRIVE_FOLDER_ICON_COLOR_DEFAULT,
  DRIVE_FOLDER_ICON_DEFAULT,
} from "@/constants/driveFolderIcons";

let cachedConfig = null;

/**
 * @returns {Promise<object>}
 */
export async function loadDriveConfig(force = false) {
  if (!force && cachedConfig) {
    return cachedConfig;
  }
  cachedConfig = await DriveController.getConfig();
  return cachedConfig;
}

/**
 * @returns {Set<string>}
 */
export function getAllowedExtensionsSet() {
  const list = cachedConfig?.allowed_file_extensions ?? DRIVE_ALLOWED_EXTENSIONS;
  return new Set(list);
}

/**
 * @returns {Set<string>}
 */
export function getImageExtensionsSet() {
  const list = cachedConfig?.image_extensions ?? DRIVE_IMAGE_EXTENSIONS;
  return new Set(list);
}

/**
 * @returns {Set<string>}
 */
export function getBrowserViewExtensionsSet() {
  const list = cachedConfig?.browser_view_extensions ?? DRIVE_BROWSER_VIEW_EXTENSIONS;
  return new Set(list);
}

/**
 * @returns {Array<{ value: string }>}
 */
export function getFolderIconOptions() {
  const icons = cachedConfig?.folder_icons;
  if (Array.isArray(icons) && icons.length > 0) {
    return icons.map((value) => ({ value }));
  }
  return [{ value: DRIVE_FOLDER_ICON_DEFAULT }];
}

/**
 * @returns {string}
 */
export function getFolderIconColorDefault() {
  const color = cachedConfig?.folder_icon_color_default;
  if (typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color.trim())) {
    return color.trim();
  }
  return DRIVE_FOLDER_ICON_COLOR_DEFAULT;
}
