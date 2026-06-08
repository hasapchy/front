import api from "./axiosInstance";
import BaseController from "./BaseController";
import { apiErrorMessage } from "./apiErrorMessage";
import DriveListingDto from "@/dto/drive/DriveListingDto";
import DriveFolderDto from "@/dto/drive/DriveFolderDto";
import DriveFileDto from "@/dto/drive/DriveFileDto";
import {
  clearDrivePreviewCache,
  fetchDrivePreviewObjectUrl,
} from "@/cache/drivePreviewCache";
export default class DriveController extends BaseController {
  static isImageFile(file) {
    return DriveFileDto.isImageFile(file);
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
      extension: DriveFileDto.getFileExtension({ name: file?.name }),
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
    return DriveFileDto.getFileExtension(file);
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
      xls: "fas fa-file-excel text-[var(--color-success)]",
      xlsx: "fas fa-file-excel text-[var(--color-success)]",
      csv: "fas fa-file-csv text-[var(--color-success)]",
      doc: "fas fa-file-word text-[var(--color-info)]",
      docx: "fas fa-file-word text-[var(--color-info)]",
      pdf: "fas fa-file-pdf text-[var(--color-danger)]",
      txt: "fas fa-file-lines text-gray-500",
      md: "fas fa-file-lines text-gray-500",
      zip: "fas fa-file-zipper text-[var(--color-warning)]",
      rar: "fas fa-file-zipper text-[var(--color-warning)]",
      "7z": "fas fa-file-zipper text-[var(--color-warning)]",
      jpg: "fas fa-file-image text-purple-500",
      jpeg: "fas fa-file-image text-purple-500",
      png: "fas fa-file-image text-purple-500",
      gif: "fas fa-file-image text-purple-500",
      webp: "fas fa-file-image text-purple-500",
      bmp: "fas fa-file-image text-purple-500",
      svg: "fas fa-file-image text-purple-500",
    };
    return map[ext] || "fas fa-file text-[var(--color-info)]";
  }

  static async getConfig() {
    return this.handleRequest(
      () => this.getData("/drive/config"),
      apiErrorMessage("driveConfig")
    );
  }

  static async getItems(parentId = null) {
    return this.handleRequest(async () => {
      const params = {};
      if (parentId !== null && parentId !== undefined) {
        params.parent_id = parentId;
      }
      const responseData = await this.getData("/drive", { params });
      return DriveListingDto.fromApi(responseData);
    }, apiErrorMessage("driveList"));
  }

  static async createFolder(payload) {
    return this.handleRequest(async () => {
      const data = await this.postData("/drive/folders", payload);
      return DriveFolderDto.fromApi(data);
    }, apiErrorMessage("driveFolderCreate"));
  }

  static async renameFolder(id, payload) {
    return this.handleRequest(async () => {
      const data = await this.putData(`/drive/folders/${id}`, payload);
      return DriveFolderDto.fromApi(data);
    }, apiErrorMessage("driveFolderUpdate"));
  }

  static async deleteFolder(id) {
    return this.handleRequest(
      () => this.deleteData(`/drive/folders/${id}`),
      apiErrorMessage("driveFolderDelete")
    );
  }

  static async uploadFiles(files, folderId = null, filePaths = [], options = {}) {
    return this.handleRequest(async () => {
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
      const data = await this.postData("/drive/files/upload", formData, {
        onUploadProgress: options.onUploadProgress,
      });
      return DriveFileDto.fromApiArray(Array.isArray(data) ? data : []);
    }, apiErrorMessage("driveFileUpload"));
  }

  static async renameFile(id, payload) {
    return this.handleRequest(async () => {
      const data = await this.putData(`/drive/files/${id}`, payload);
      return DriveFileDto.fromApi(data);
    }, apiErrorMessage("driveFileUpdate"));
  }

  static async deleteItem(id) {
    return this.deleteFile(id);
  }

  static async deleteFile(id, companyId = null) {
    const result = await this.handleRequest(
      () => this.deleteData(`/drive/files/${id}`),
      apiErrorMessage("driveFileDelete")
    );
    if (companyId) {
      await clearDrivePreviewCache(companyId, id);
    }
    return result;
  }

  static async batchDelete(ids) {
    return this.handleRequest(
      () => super.postUnifiedBatchDelete("drive_files", ids),
      apiErrorMessage("driveFileBatchDelete")
    );
  }

  static async moveFiles(fileIds, targetFolderId = null) {
    return this.handleRequest(async () => {
      const data = await this.postData("/drive/files/move", {
        file_ids: fileIds,
        target_folder_id: targetFolderId,
      });
      return DriveFileDto.fromApiArray(Array.isArray(data) ? data : []);
    }, apiErrorMessage("driveFilesMove"));
  }

  static async listPermissions(resourceType, resourceId) {
    return this.handleRequest(
      () => this.getData("/drive/permissions", {
        params: {
          resource_type: resourceType,
          resource_id: resourceId,
        },
      }),
      apiErrorMessage("drivePermissionList")
    );
  }

  static async setPermission(payload) {
    return this.handleRequest(
      () => this.postData("/drive/permissions", payload),
      apiErrorMessage("drivePermissionSet")
    );
  }

  static async fetchFilePreviewUrl(id, companyId) {
    return this.handleRequest(
      () => fetchDrivePreviewObjectUrl(companyId, id),
      apiErrorMessage("driveFilePreview", { id })
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
    }, apiErrorMessage("driveFileDownload", { id }));
  }
}
