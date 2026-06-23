import { createFromApiArray } from "@/utils/dtoUtils";
import { dtoDateFormatters } from "@/utils/dateUtils";

export default class DriveFolderDto {
  constructor(
    id,
    companyId,
    parentId,
    creatorId,
    name,
    icon,
    iconColor,
    createdAt,
    updatedAt,
    creator = null,
    isShared = false,
    projectId = null,
    systemKey = null
  ) {
    this.id = id;
    this.companyId = companyId;
    this.parentId = parentId;
    this.creatorId = creatorId;
    this.name = name;
    this.icon = icon;
    this.icon_color = iconColor;
    this.iconColor = iconColor;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.creator = creator;
    this.isShared = Boolean(isShared);
    this.projectId = projectId;
    this.project_id = projectId;
    this.systemKey = systemKey;
    this.system_key = systemKey;
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

  static fromApi(data) {
    if (!data) {
      return null;
    }
    return new DriveFolderDto(
      data.id,
      data.company_id,
      data.parent_id,
      data.creator_id,
      data.name,
      data.icon,
      data.icon_color,
      data.created_at,
      data.updated_at,
      data.creator ?? null,
      data.is_shared,
      data.project_id ?? null,
      data.system_key ?? null
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, DriveFolderDto.fromApi).filter(Boolean);
  }
}
