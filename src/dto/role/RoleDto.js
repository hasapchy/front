import { createFromApiArray } from "@/utils/dtoUtils";
import BaseDto from "@/dto/BaseDto";

/**
 * DTO для ролей пользователей
 * @class RoleDto
 * @extends BaseDto
 */
export default class RoleDto extends BaseDto {
  /**
   * Создает экземпляр RoleDto
   * @param {Object} params - Параметры роли
   * @param {number} params.id - ID роли
   * @param {string} params.name - Название роли
   * @param {string} params.guard_name - Имя guard (обычно "api")
   * @param {number|null} params.company_id - ID компании (если роль привязана к компании)
   * @param {string} params.created_at - Дата создания
   * @param {string} params.updated_at - Дата обновления
   * @param {Array<string|Object>} params.permissions - Массив разрешений (строки или объекты)
   */
  constructor({
    id,
    name,
    guard_name,
    company_id,
    created_at,
    updated_at,
    permissions = []
  }) {
    super();
    this.id = id;
    this.name = name;
    this.guardName = guard_name;
    this.companyId = company_id;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
    this.permissions = (permissions || []).map(p => 
      typeof p === 'string' ? p : (p.name || p)
    );
  }

  /**
   * Получить список названий разрешений
   * @returns {Array<string>} Массив названий разрешений
   */
  getPermissionNames() {
    return this.permissions;
  }

  /**
   * Проверить наличие разрешения у роли
   * @param {string} permissionName - Название разрешения
   * @returns {boolean} true, если разрешение есть, иначе false
   */
  hasPermission(permissionName) {
    return this.permissions.includes(permissionName);
  }

  /**
   * Получить количество разрешений у роли
   * @returns {number} Количество разрешений
   */
  getPermissionsCount() {
    return this.permissions.length;
  }

  /**
   * Создает массив экземпляров RoleDto из массива данных API
   * @param {Array} dataArray - Массив объектов ролей из API
   * @returns {Array<RoleDto>} Массив экземпляров RoleDto
   */
  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new RoleDto({
        id: data.id,
        name: data.name,
        guard_name: data.guard_name,
        company_id: data.company_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        permissions: data.permissions || []
      });
    });
  }
}

