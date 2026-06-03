import BaseController from "./BaseController";

export default class DriveController extends BaseController {
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
    files.forEach((file) => formData.append("files[]", file));
    filePaths.forEach((path) => formData.append("file_paths[]", path));
    if (folderId !== null && folderId !== undefined) {
      formData.append("folder_id", String(folderId));
    }
    return this.postData("/drive/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: options.onUploadProgress,
    });
  }

  static async deleteFile(id) {
    return this.deleteData(`/drive/files/${id}`);
  }

  static async moveFile(id, targetFolderId = null) {
    return this.postData(`/drive/files/${id}/move`, {
      target_folder_id: targetFolderId,
    });
  }

  static async setPermission(payload) {
    return this.postData("/drive/permissions", payload);
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
