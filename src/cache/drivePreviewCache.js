import api from "@/api/axiosInstance";
import CACHE_TTL from "@/constants/cacheTTL";
import { indexedDBBlobStorage } from "./storage";
import { clearKey, isFreshByKey, touchKey } from "./invalidator";

const TTL_MS = CACHE_TTL.drivePreviews;

/**
 * @param {number|string} companyId
 * @param {number|string} fileId
 * @returns {string}
 */
export function drivePreviewCacheKey(companyId, fileId) {
  return `drivePreview_${companyId}_${fileId}`;
}

/**
 * @param {number|string} companyId
 * @returns {string}
 */
export function drivePreviewCompanyPrefix(companyId) {
  return `drivePreview_${companyId}_`;
}

/**
 * @param {number|string} companyId
 * @param {number|string} fileId
 * @returns {Promise<void>}
 */
export async function clearDrivePreviewCache(companyId, fileId) {
  const key = drivePreviewCacheKey(companyId, fileId);
  clearKey(key);
  await indexedDBBlobStorage.removeItem(key);
}

/**
 * @param {number|string} companyId
 * @returns {Promise<void>}
 */
export async function clearDrivePreviewCacheForCompany(companyId) {
  if (!companyId) {
    return;
  }
  const prefix = drivePreviewCompanyPrefix(companyId);
  Object.keys(localStorage).forEach((storageKey) => {
    if (storageKey.startsWith(prefix)) {
      localStorage.removeItem(storageKey);
    }
  });
  await indexedDBBlobStorage.removeByPrefix(prefix);
}

/**
 * @param {number|string} companyId
 * @param {number|string} fileId
 * @returns {Promise<string|null>}
 */
export async function fetchDrivePreviewObjectUrl(companyId, fileId) {
  if (!companyId || !fileId) {
    return null;
  }

  const key = drivePreviewCacheKey(companyId, fileId);
  if (isFreshByKey(key, TTL_MS)) {
    const cachedBlob = await indexedDBBlobStorage.getItem(key);
    if (cachedBlob) {
      return window.URL.createObjectURL(cachedBlob);
    }
  } else {
    clearKey(key);
    await indexedDBBlobStorage.removeItem(key);
  }

  const response = await api.get(`/drive/files/${fileId}/preview`, {
    responseType: "blob",
  });
  const raw = response.data;
  if (!(raw instanceof Blob)) {
    return null;
  }

  const contentType = String(response.headers?.["content-type"] || raw.type || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (contentType.includes("application/json") || contentType.includes("text/html")) {
    return null;
  }

  const blob = raw.type || !contentType
    ? raw
    : new Blob([raw], { type: contentType });

  await indexedDBBlobStorage.setItem(key, blob);
  touchKey(key);
  return window.URL.createObjectURL(blob);
}
