export class CompanyDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.logo = data.logo;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Метод для получения URL логотипа
  logoUrl() {
    if (this.logo && this.logo.length > 0) {
      // Добавляем timestamp для инвалидации кэша браузера
      const timestamp = this.updatedAt ? new Date(this.updatedAt).getTime() : Date.now();
      return `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.logo}?v=${timestamp}`;
    }
    return '/logo.jpg'; // Дефолтный логотип
  }

  static fromArray(companies) {
    if (!companies || !Array.isArray(companies)) {
      return [];
    }
    return companies.map((company) => new CompanyDto(company));
  }
}
