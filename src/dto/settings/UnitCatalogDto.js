import { createFromApiArray } from '@/utils/dtoUtils';

export default class UnitCatalogDto {
  constructor({ id, name, short_name, company_id, is_system }) {
    this.id = id;
    this.name = name;
    this.shortName = short_name;
    this.companyId = company_id;
    this.isSystem = is_system === true;
  }

  static fromApi(data) {
    if (!data) {
      return null;
    }
    return new UnitCatalogDto({
      id: data.id,
      name: data.name,
      short_name: data.short_name,
      company_id: data.company_id,
      is_system: data.is_system,
    });
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, (data) => new UnitCatalogDto({
      id: data.id,
      name: data.name,
      short_name: data.short_name,
      company_id: data.company_id,
      is_system: data.is_system,
    })).filter(Boolean);
  }
}
