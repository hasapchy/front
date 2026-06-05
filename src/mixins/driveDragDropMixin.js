import DriveController from "@/api/DriveController";

export const DRIVE_FILE_DRAG_TYPE = "application/x-birhasap-drive-file-id";

export default {
  data() {
    return {
      isPageDragOver: false,
      dragEnterCounter: 0,
      dragOverFolderId: null,
      draggingFileId: null,
      uploading: false,
      uploadProgress: {
        percent: 0,
        filesCount: 0,
      },
    };
  },
  methods: {
    canUploadFiles() {
      return this.$store.getters.hasPermission("drive_create") && !this.uploading;
    },
    isUnsupportedFileTypeError(error) {
      if (error?.code === "UNSUPPORTED_FILE_TYPE") {
        return true;
      }
      const message = String(
        error?.response?.data?.error
        || error?.response?.data?.message
        || "",
      ).toLowerCase();
      return message.includes("unsupported file type")
        || message.includes("неподдерживаемый тип файла");
    },
    getUnsupportedFileTypeMessage(error) {
      if (error?.rejectedFiles?.length) {
        const lines = error.rejectedFiles.map((file) => {
          const typeLabel = file.extension ? `.${file.extension}` : this.$t("unknownFileType");
          return this.$t("unsupportedFileTypeLine", { name: file.name, type: typeLabel });
        });
        if (lines.length === 1) {
          return `${this.$t("unsupportedFileType")}: ${lines[0]}`;
        }
        return `${this.$t("unsupportedFileType")}:\n${lines.join("\n")}`;
      }
      const apiMessage = error?.response?.data?.error || error?.response?.data?.message;
      if (apiMessage) {
        return apiMessage;
      }
      return this.$t("unsupportedFileType");
    },
    showUploadError(error) {
      const message = this.isUnsupportedFileTypeError(error)
        ? this.getUnsupportedFileTypeMessage(error)
        : this.getApiErrorMessage(error).join("\n") || this.$t("errorSavingData");
      this.showNotification(this.$t("error"), message, true);
    },
    isInternalFileDrag(event) {
      return Array.from(event?.dataTransfer?.types || []).includes(DRIVE_FILE_DRAG_TYPE);
    },
    isOsFileDrag(event) {
      return Array.from(event?.dataTransfer?.types || []).includes("Files");
    },
    isUploadDrag(event) {
      return !this.draggingFileId && !this.isInternalFileDrag(event) && this.isOsFileDrag(event);
    },
    getDraggedFileId(event) {
      const raw = event?.dataTransfer?.getData(DRIVE_FILE_DRAG_TYPE);
      const parsed = Number.parseInt(String(raw ?? ""), 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
      }
      return parsed;
    },
    extractDroppedFiles(event) {
      return Array.from(event?.dataTransfer?.files || []).filter((file) => file && file.name);
    },
    resetDragState() {
      this.dragEnterCounter = 0;
      this.isPageDragOver = false;
      this.dragOverFolderId = null;
    },
    onPageDragEnter(event) {
      if (!this.canUploadFiles() || !this.isUploadDrag(event)) {
        return;
      }
      this.dragEnterCounter += 1;
      this.isPageDragOver = true;
    },
    onPageDragOver(event) {
      if (!this.canUploadFiles() || !this.isUploadDrag(event)) {
        return;
      }
      event.dataTransfer.dropEffect = "copy";
      this.isPageDragOver = true;
    },
    onPageDragLeave(event) {
      if (!this.isUploadDrag(event)) {
        return;
      }
      this.dragEnterCounter = Math.max(0, this.dragEnterCounter - 1);
      if (this.dragEnterCounter === 0) {
        this.isPageDragOver = false;
      }
    },
    async handleUploadFiles(files, folderId = null, filePaths = []) {
      const allowedFiles = DriveController.filterAllowedUploadFiles(files);
      this.uploading = true;
      this.uploadProgress.filesCount = allowedFiles.length;
      this.uploadProgress.percent = 0;
      try {
        await DriveController.uploadFiles(allowedFiles, folderId, filePaths, {
          onUploadProgress: (progressEvent) => {
            const total = Number(progressEvent?.total || 0);
            if (total <= 0) {
              return;
            }
            const loaded = Number(progressEvent?.loaded || 0);
            const percent = Math.min(100, Math.max(0, Math.round((loaded / total) * 100)));
            this.uploadProgress.percent = percent;
          },
        });
      } finally {
        this.uploadProgress.percent = 0;
        this.uploadProgress.filesCount = 0;
        this.uploading = false;
      }
    },
    async onPageDrop(event) {
      this.resetDragState();
      if (!this.canUploadFiles() || this.isInternalFileDrag(event) || this.getDraggedFileId(event)) {
        return;
      }
      const files = this.extractDroppedFiles(event);
      if (files.length === 0) {
        return;
      }
      try {
        await this.handleUploadFiles(files, this.parentId);
        await this.fetchItems();
      } catch (error) {
        this.showUploadError(error);
      }
    },
    async onFilesInputChange(event, isFolder) {
      const input = event?.target;
      const files = Array.from(input?.files || []);
      if (input) {
        input.value = "";
      }
      if (files.length === 0) {
        return;
      }
      const filePaths = isFolder
        ? files.map((file) => file.webkitRelativePath || file.name)
        : [];
      try {
        await this.handleUploadFiles(files, this.parentId, filePaths);
        await this.fetchItems();
      } catch (error) {
        this.showUploadError(error);
      }
    },
    onFileDragStart(event, file) {
      if (!this.$store.getters.hasPermission("drive_update")) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData(DRIVE_FILE_DRAG_TYPE, String(file.id));
      event.dataTransfer.effectAllowed = "move";
      this.draggingFileId = file.id;
    },
    onFileDragEnd() {
      this.draggingFileId = null;
      this.dragOverFolderId = null;
      this.resetDragState();
    },
    onFolderDragOver(event, folderId) {
      if (this.isInternalFileDrag(event)) {
        if (!this.$store.getters.hasPermission("drive_update")) {
          return;
        }
        event.dataTransfer.dropEffect = "move";
        this.dragOverFolderId = folderId;
        return;
      }
      if (!this.canUploadFiles() || !this.isOsFileDrag(event)) {
        return;
      }
      event.dataTransfer.dropEffect = "copy";
      this.dragOverFolderId = folderId;
    },
    onFolderDragLeave(event, folderId) {
      const currentTarget = event.currentTarget;
      if (currentTarget && event.relatedTarget && currentTarget.contains(event.relatedTarget)) {
        return;
      }
      if (this.dragOverFolderId === folderId) {
        this.dragOverFolderId = null;
      }
    },
    async onFolderDrop(event, folderId) {
      event.stopPropagation();
      const draggedFileId = this.getDraggedFileId(event);
      if (draggedFileId) {
        this.resetDragState();
        this.onFileDragEnd();
        try {
          await this.performBatchMoveFiles([draggedFileId], folderId);
        } catch (error) {
          this.showNotification(
            this.$t("error"),
            this.getApiErrorMessage(error).join("\n") || this.$t("errorSavingData"),
            true,
          );
        }
        return;
      }
      this.resetDragState();
      if (!this.canUploadFiles()) {
        return;
      }
      const files = this.extractDroppedFiles(event);
      if (files.length === 0) {
        return;
      }
      try {
        await this.handleUploadFiles(files, folderId);
        await this.fetchItems();
      } catch (error) {
        this.showUploadError(error);
      }
    },
  },
};
