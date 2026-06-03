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

  const { data } = await api.get(`/drive/files/${fileId}/preview`, {
    responseType: "blob",
  });
  if (!(data instanceof Blob)) {
    return null;
  }

  await indexedDBBlobStorage.setItem(key, data);
  touchKey(key);
  return window.URL.createObjectURL(data);
}
