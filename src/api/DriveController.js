import api from "./axiosInstance";
import BaseController from "./BaseController";
import {
  clearDrivePreviewCache,
  fetchDrivePreviewObjectUrl,
} from "@/cache/drivePreviewCache";

const DRIVE_ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg", "gif", "bmp", "svg",
  "zip", "rar", "7z", "txt", "md", "csv", "webp",
]);

const DRIVE_IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg",
]);

export default class DriveController extends BaseController {
  static isImageFile(file) {
    const name = String(file?.name || "");
    const parts = name.split(".");
    if (parts.length < 2) {
      return false;
    }
    const extension = parts.pop().toLowerCase();
    if (DRIVE_IMAGE_EXTENSIONS.has(extension)) {
      return true;
    }
    const mime = String(file?.mime_type || file?.mimeType || "").toLowerCase();
    return mime.startsWith("image/");
  }

  static isAllowedFile(file) {
    const name = String(file?.name || "");
    const parts = name.split(".");
    if (parts.length < 2) {
      return false;
    }
    const extension = parts.pop().toLowerCase();
    return DRIVE_ALLOWED_EXTENSIONS.has(extension);
  }

  static partitionAllowedFiles(files) {
    const list = Array.from(files || []);
    const allowed = [];
    const rejected = [];
    list.forEach((file) => {
      if (this.isAllowedFile(file)) {
        allowed.push(file);
      } else {
        rejected.push(file);
      }
    });
    return { allowed, rejected };
  }

  static describeRejectedUploadFiles(rejected) {
    return rejected.map((file) => ({
      name: String(file?.name || ""),
      extension: this.getFileExtension({ name: file?.name }),
    }));
  }

  static filterAllowedUploadFiles(files) {
    const { allowed, rejected } = this.partitionAllowedFiles(files);
    if (rejected.length > 0 || allowed.length === 0) {
      const error = new Error("unsupported_file_type");
      error.code = "UNSUPPORTED_FILE_TYPE";
      error.rejectedFiles = this.describeRejectedUploadFiles(rejected);
      throw error;
    }
    return allowed;
  }

  static getFileExtension(file) {
    if (file?.extension) {
      return String(file.extension).toLowerCase();
    }
    const name = String(file?.name || "");
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  }

  static splitFileBaseName(name, extension = "") {
    const full = String(name || "").trim();
    const ext = String(extension || "").toLowerCase().replace(/^\./, "");
    if (ext) {
      const suffix = `.${ext}`;
      if (full.toLowerCase().endsWith(suffix)) {
        return full.slice(0, -suffix.length);
      }
    }
    const lastDot = full.lastIndexOf(".");
    if (lastDot <= 0) {
      return full;
    }
    return full.slice(0, lastDot);
  }

  static buildFileName(baseName, extension = "") {
    const base = String(baseName || "").trim().replace(/\.+$/, "");
    const ext = String(extension || "").toLowerCase().replace(/^\./, "");
    if (!base) {
      return "";
    }
    return ext ? `${base}.${ext}` : base;
  }

  static getFileIconClass(file) {
    const ext = this.getFileExtension(file);
    const map = {
      xls: "fas fa-file-excel text-green-500",
      xlsx: "fas fa-file-excel text-green-500",
      csv: "fas fa-file-csv text-green-500",
      doc: "fas fa-file-word text-blue-500",
      docx: "fas fa-file-word text-blue-500",
      pdf: "fas fa-file-pdf text-red-500",
      txt: "fas fa-file-lines text-gray-500",
      md: "fas fa-file-lines text-gray-500",
      zip: "fas fa-file-zipper text-amber-500",
      rar: "fas fa-file-zipper text-amber-500",
      "7z": "fas fa-file-zipper text-amber-500",
      jpg: "fas fa-file-image text-purple-500",
      jpeg: "fas fa-file-image text-purple-500",
      png: "fas fa-file-image text-purple-500",
      gif: "fas fa-file-image text-purple-500",
      webp: "fas fa-file-image text-purple-500",
      bmp: "fas fa-file-image text-purple-500",
      svg: "fas fa-file-image text-purple-500",
    };
    return map[ext] || "fas fa-file text-blue-400";
  }
  static async getItems(parentId = null) {
    const params = {};
    if (parentId !== null && parentId !== undefined) {
      params.parent_id = parentId;
    }
    return this.getData("/drive", { params });
  }

  static async createFolder(payload) {
    return this.postData("/drive/folders", payload);
  }

  static async renameFolder(id, payload) {
    return this.putData(`/drive/folders/${id}`, payload);
  }

  static async deleteFolder(id) {
    return this.deleteData(`/drive/folders/${id}`);
  }

  static async uploadFiles(files, folderId = null, filePaths = [], options = {}) {
    const formData = new FormData();
    files.forEach((file, index) => {
      const name = file?.name || `file-${index}`;
      formData.append(`files[${index}]`, file, name);
    });
    filePaths.forEach((path, index) => {
      formData.append(`file_paths[${index}]`, path);
    });
    if (folderId !== null && folderId !== undefined) {
      formData.append("folder_id", String(folderId));
    }
    return this.postData("/drive/files/upload", formData, {
      onUploadProgress: options.onUploadProgress,
    });
  }

  static async renameFile(id, payload) {
    return this.putData(`/drive/files/${id}`, payload);
  }

  static async deleteItem(id) {
    return this.deleteFile(id);
  }

  static async deleteFile(id, companyId = null) {
    const result = await this.deleteData(`/drive/files/${id}`);
    if (companyId) {
      await clearDrivePreviewCache(companyId, id);
    }
    return result;
  }

  static async batchDelete(ids) {
    return super.postUnifiedBatchDelete("drive_files", ids);
  }

  static async moveFile(id, targetFolderId = null) {
    return this.postData(`/drive/files/${id}/move`, {
      target_folder_id: targetFolderId,
    });
  }

  static async setPermission(payload) {
    return this.postData("/drive/permissions", payload);
  }

  static async fetchFilePreviewUrl(id, companyId) {
    return this.handleRequest(
      () => fetchDrivePreviewObjectUrl(companyId, id),
      `Failed to load file preview ${id}`,
    );
  }

  static async downloadFile(id, filename = "file") {
    return this.handleRequest(async () => {
      const response = await this.get(`/drive/files/${id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    }, `Failed to download file ${id}`);
  }
}
