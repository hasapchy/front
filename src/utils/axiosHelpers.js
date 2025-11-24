import axios from 'axios';
import api, { createCancelToken, isCancelError } from "@/api/axiosInstance";
import basementApi, {
  createBasementCancelToken,
  isBasementCancelError,
} from "@/api/basement/basementAxiosInstance";

/**
 * Filters out null, undefined, and empty string values from params object.
 * @param {object} params - Parameters object to filter.
 * @returns {object} Filtered parameters object.
 */
export const filterParams = (params) => {
  return Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value != null && value !== '')
  );
};

/**
 * Gets the full URL for a request without executing it.
 * Useful for debugging, logging, or generating URLs for external use.
 * @param {object} config - Axios request config object.
 * @param {string|object} apiInstance - Optional axios instance (defaults to main api).
 * @returns {string} Full URL string.
 */
export const getRequestUrl = (config, apiInstance = null) => {
  if (apiInstance && typeof apiInstance.getUri === 'function') {
    return apiInstance.getUri(config);
  }
  return axios.getUri(config);
};

export const createRequestController = (useBasement = false) => {
  const cancelTokenSource = useBasement
    ? createBasementCancelToken()
    : createCancelToken();

  return {
    cancel: () => {
      cancelTokenSource.cancel("Request cancelled by user");
    },
    token: cancelTokenSource.token,
    isCancelled: (error) => {
      return useBasement ? isBasementCancelError(error) : isCancelError(error);
    },
  };
};

export const uploadWithProgress = async (url, formData, options = {}) => {
  const {
    onProgress,
    cancelToken,
    useBasement = false,
    timeout = 60000,
    ...restOptions
  } = options;

  const apiInstance = useBasement ? basementApi : api;

  return apiInstance.post(url, formData, {
    ...restOptions,
    timeout,
    cancelToken,
    headers: {
      "Content-Type": "multipart/form-data",
      ...restOptions.headers,
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress({
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percent: percentCompleted,
        });
      }
    },
  });
};

export const downloadWithProgress = async (url, options = {}) => {
  const {
    onProgress,
    cancelToken,
    useBasement = false,
    responseType = "blob",
    ...restOptions
  } = options;

  const apiInstance = useBasement ? basementApi : api;

  return apiInstance.get(url, {
    ...restOptions,
    cancelToken,
    responseType,
    onDownloadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress({
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percent: percentCompleted,
        });
      }
    },
  });
};

export {
  createCancelToken,
  isCancelError,
  createBasementCancelToken,
  isBasementCancelError,
};
