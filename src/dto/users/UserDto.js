import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";
import { stripPositionFromFullName } from "@/utils/displayUtils";

export class UserDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.surname = data.surname;
    this.email = data.email;
    this.phone = data.phone ?? null;
    this.emailVerifiedAt = data.email_verified_at;
    this.hireDate = data.hire_date;
    this.dismissalDate = data.dismissal_date;
    this.birthday = data.birthday;
    this.position = data.position;
    this.isActive = Number(data.is_active) === 1;
    this.isAdmin = Number(data.is_admin) === 1;
    this.photo = data.photo;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.lastLoginAt = data.last_login_at;

    this.permissions = data.permissions?.map((p) => p.name) ?? [];
    this.roles = data.roles?.map((r) => r?.name ?? r) ?? [];
    this.companies = data.companies?.map((c) => ({ id: c.id, name: c.name })) ?? [];
    this.companyRoles = data.company_roles?.map((companyRole) => ({
      companyId: companyRole.company_id,
      roleIds: companyRole.role_ids ?? [],
    })) ?? [];
    this.departments = data.departments?.map((d) => ({
      id: d.id,
      title: d.title,
      companyId: d.company_id
    })) ?? [];
    this.lastSalary = data.last_salary ?? null;
  }

  photoUrl() {
    return getImageUrl(this.photo);
  }

  fullName() {
    const name = this.name ;
    const surname = this.surname ;
    const position = this.position ;
    const fullName = [name, surname].filter(Boolean).join(' ').trim();
    if (position) {
      return `${fullName} (${position})`;
    }
    return fullName;
  }

  displayName() {
    return stripPositionFromFullName(this.fullName());
  }

  static fromApi(data) {
    if (!data) return null;
    return new UserDto(data);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, UserDto.fromApi);
  }
}
