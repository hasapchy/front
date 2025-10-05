export class CompanyDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static fromArray(companies) {
    if (!companies || !Array.isArray(companies)) {
      return [];
    }
    return companies.map((company) => new CompanyDto(company));
  }
}
