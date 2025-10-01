export class UserDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.emailVerifiedAt = data.email_verified_at;
    this.hireDate = data.hire_date;
    this.position = data.position;
    this.isActive = Boolean(data.is_active);
    this.isAdmin = Boolean(data.is_admin);
    this.photo = data.photo;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.lastLoginAt = data.last_login_at;

    this.permissions = data.permissions?.map((p) => p.name) || [];
    this.companies = data.companies?.map((c) => ({ id: c.id, name: c.name })) || [];
  }

  // Метод для получения URL фото (как в ProductDto)
  photoUrl() {
    if (this.photo && this.photo.length > 0) {
      return `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.photo}`;
    }
    return null;
  }

  static fromArray(users) {
    return users.map((user) => new UserDto(user));
  }
}
