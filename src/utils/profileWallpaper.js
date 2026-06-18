/**
 * @param {Array<{ id: string, supported_modes?: string[], files?: Record<string, string> }>|null|undefined} catalog
 * @param {string|null|undefined} selectedId
 * @param {'light'|'dark'|string} uiTheme
 * @returns {string|null}
 */
export function resolveActiveWallpaperUrl(catalog, selectedId, uiTheme) {
  if (!selectedId || selectedId === "default") {
    return null;
  }

  if (!Array.isArray(catalog) || catalog.length === 0) {
    return null;
  }

  const theme = catalog.find((item) => item?.id === selectedId);
  if (!theme) {
    return null;
  }

  const mode = uiTheme === "dark" ? "dark" : "light";
  const supportedModes = Array.isArray(theme.supported_modes) ? theme.supported_modes : [];

  if (!supportedModes.includes(mode)) {
    return null;
  }

  const files = theme.files && typeof theme.files === "object" ? theme.files : {};
  const url = files[mode];

  return typeof url === "string" && url !== "" ? url : null;
}

/**
 * @param {{ supported_modes?: string[] }} theme
 * @param {'light'|'dark'|string} uiTheme
 * @returns {boolean}
 */
export function isWallpaperAvailableInUiTheme(theme, uiTheme) {
  const mode = uiTheme === "dark" ? "dark" : "light";
  const supportedModes = Array.isArray(theme?.supported_modes) ? theme.supported_modes : [];

  return supportedModes.includes(mode);
}

/**
 * @param {{ supported_modes?: string[] }} theme
 * @returns {'light'|'dark'|'both'|'none'}
 */
export function wallpaperModeKind(theme) {
  const supportedModes = Array.isArray(theme?.supported_modes) ? theme.supported_modes : [];
  const hasLight = supportedModes.includes("light");
  const hasDark = supportedModes.includes("dark");

  if (hasLight && hasDark) {
    return "both";
  }
  if (hasLight) {
    return "light";
  }
  if (hasDark) {
    return "dark";
  }

  return "none";
}
