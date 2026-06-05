import { createFromApiArray } from "@/utils/dtoUtils";
import { dtoDateFormatters } from "@/utils/dateUtils";
import { getAllowedExtensionsSet, getImageExtensionsSet } from "@/utils/driveConfig";

export default class DriveFileDto {
  constructor(
    id,
    companyId,
    folderId,
    creatorId,
    disk,
    name,
    mimeType,
    extension,
    size,
    createdAt,
    updatedAt,
    creator = null
  ) {
    this.id = id;
    this.companyId = companyId;
    this.folder_id = folderId;
    this.folderId = folderId;
    this.creatorId = creatorId;
    this.disk = disk;
    this.name = name;
    this.mime_type = mimeType;
    this.mimeType = mimeType;
    this.extension = extension;
    this.size = size;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.creator = creator;
  }

  creatorDisplayName() {
    if (!this.creator) {
      return "-";
    }
    return [this.creator.name, this.creator.surname].filter(Boolean).join(" ") || "-";
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt) || "-";
  }

  formatSize() {
    const num = Number(this.size);
    if (!Number.isFinite(num) || num <= 0) {
      return "0 B";
    }
    const units = ["B", "KB", "MB", "GB"];
    const power = Math.min(Math.floor(Math.log(num) / Math.log(1024)), units.length - 1);
    return `${(num / 1024 ** power).toFixed(2)} ${units[power]}`;
  }

  isImage() {
    return DriveFileDto.isImageFile(this);
  }

  static getFileExtension(file) {
    if (file?.extension) {
      return String(file.extension).toLowerCase();
    }
    const name = String(file?.name || "");
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  }

  static isImageFile(file) {
    if (file instanceof DriveFileDto) {
      const extension = String(file.extension || "").toLowerCase();
      if (getImageExtensionsSet().has(extension)) {
        return true;
      }
      const mime = String(file.mime_type || file.mimeType || "").toLowerCase();
      return mime.startsWith("image/");
    }
    const extension = DriveFileDto.getFileExtension(file);
    if (getImageExtensionsSet().has(extension)) {
      return true;
    }
    const mime = String(file?.mime_type || file?.mimeType || "").toLowerCase();
    return mime.startsWith("image/");
  }

  static isAllowedFile(file) {
    const extension = DriveFileDto.getFileExtension(file);
    return extension !== "" && getAllowedExtensionsSet().has(extension);
  }

  static fromApi(data) {
    if (!data) {
      return null;
    }
    return new DriveFileDto(
      data.id,
      data.company_id,
      data.folder_id,
      data.creator_id,
      data.disk,
      data.name,
      data.mime_type,
      data.extension,
      data.size,
      data.created_at,
      data.updated_at,
      data.creator ?? null
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, DriveFileDto.fromApi).filter(Boolean);
  }
}
