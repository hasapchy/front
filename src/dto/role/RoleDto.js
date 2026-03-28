import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class RoleDto {
  constructor(id, name, permissions = [], createdAt = "", updatedAt = "", companyId = null) {
    this.id = id;
    this.name = name;
    this.permissions = permissions;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.companyId = companyId;
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  static fromApi(data) {
    if (!data) return null;
    return new RoleDto(
      data.id,
      data.name,
      data.permissions ?? [],
      data.created_at,
      data.updated_at,
      data.company_id ?? null
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, RoleDto.fromApi).filter(Boolean);
  }
}

