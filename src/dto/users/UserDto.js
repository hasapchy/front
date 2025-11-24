import { getImageUrl, createFromApiArray, normalizeBoolean } from "@/utils/dtoUtils";

export default class UserDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.emailVerifiedAt = data.email_verified_at;
    this.hireDate = data.hire_date;
    this.birthday = data.birthday;
    this.position = data.position;
    this.isActive = normalizeBoolean(data.is_active, false);
    this.isAdmin = normalizeBoolean(data.is_admin, false);
    this.photo = data.photo;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.lastLoginAt = data.last_login_at;

    this.permissions = data.permissions?.map((p) => p.name) || [];
    this.roles = data.roles?.map((r) => typeof r === 'string' ? r : (r.name || r)) || [];
    this.companies = data.companies?.map((c) => ({ id: c.id, name: c.name })) || [];
    this.company_roles = data.company_roles || [];
    this.lastSalary = data.last_salary || null;
  }

  photoUrl() {
    return getImageUrl(this.photo);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, (data) => new UserDto(data));
  }
}
