import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";

export class UserDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.surname = data.surname;
    this.email = data.email;
    this.phone = data.phone || null;
    this.emailVerifiedAt = data.email_verified_at;
    this.hireDate = data.hire_date;
    this.birthday = data.birthday;
    this.position = data.position;
    this.isActive = Boolean(data.is_active);
    this.isAdmin = Boolean(data.is_admin);
    this.photo = data.photo;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.lastLoginAt = data.last_login_at;

    this.permissions = data.permissions?.map((p) => p.name) || [];
    this.roles = data.roles?.map((r) => typeof r === 'string' ? r : (r.name || r)) || [];
    this.companies = data.companies?.map((c) => ({ id: c.id, name: c.name })) || [];
    this.company_roles = data.company_roles || [];
    this.departments = data.departments?.map((d) => ({
      id: d.id,
      title: d.title,
      companyId: d.company_id
    })) || [];
    this.lastSalary = data.last_salary || null;
  }

  photoUrl() {
    return getImageUrl(this.photo);
  }

  fullName() {
    const name = this.name || '';
    const surname = this.surname || '';
    const position = this.position || '';
    const fullName = [name, surname].filter(Boolean).join(' ').trim();
    if (position) {
      return `${fullName} (${position})`;
    }
    return fullName;
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, (data) => new UserDto(data));
  }
}
