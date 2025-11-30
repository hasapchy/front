import { PERMISSIONS_CONFIG } from './config';

export class PermissionParser {
  static parse(permissionName) {
    if (!permissionName || typeof permissionName !== 'string') {
      return null;
    }

    if (permissionName.startsWith('settings_')) {
      return {
        type: 'custom',
        category: 'settings',
        name: permissionName,
        resource: null,
        action: null,
        scope: null,
      };
    }

    const parts = permissionName.split('_');

    if (parts.length < 2) {
      return null;
    }

    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts[parts.length - 2];

    let resource, action, scope;

    if (lastPart === 'all' || lastPart === 'own') {
      scope = lastPart;
      action = secondLastPart;
      resource = parts.slice(0, -2).join('_');
    } else if (lastPart === 'create') {
      scope = null;
      action = 'create';
      resource = parts.slice(0, -1).join('_');
    } else if (['view', 'update', 'delete'].includes(lastPart)) {
      scope = null;
      action = lastPart;
      resource = parts.slice(0, -1).join('_');
    } else {
      const resourceConfig = this.getResourceConfig();
      for (const [resourceName, config] of Object.entries(resourceConfig)) {
        if (config?.custom_permissions) {
          for (const [key, customPermName] of Object.entries(config.custom_permissions)) {
            if (customPermName === permissionName) {
              return {
                type: 'custom',
                category: 'resource_custom',
                name: permissionName,
                resource: resourceName,
                action: key,
                scope: null,
              };
            }
          }
        }
      }

      return null;
    }

    return {
      type: 'standard',
      category: 'resource',
      name: permissionName,
      resource,
      action,
      scope,
    };
  }

  static generate(resource, action, scope = null) {
    if (scope) {
      return `${resource}_${action}_${scope}`;
    }
    return `${resource}_${action}`;
  }

  static isStandard(permissionName) {
    const parsed = this.parse(permissionName);
    return parsed !== null && parsed.type === 'standard';
  }

  static isCustom(permissionName) {
    const parsed = this.parse(permissionName);
    return parsed !== null && parsed.type === 'custom';
  }

  static getResourceConfig() {
    return PERMISSIONS_CONFIG?.resources || {};
  }

  static parsePermissions(permissions) {
    if (!Array.isArray(permissions)) {
      return {
        resources: {},
        custom: [],
      };
    }

    const result = {
      resources: {},
      custom: [],
    };

    permissions.forEach((perm) => {
      if (!perm || !perm.name) {
        return;
      }

      const parsed = this.parse(perm.name);

      if (!parsed) {
        return;
      }

      if (parsed.type === 'custom') {
        result.custom.push(perm);
      } else if (parsed.type === 'standard') {
        const { resource, action, scope } = parsed;

        if (!result.resources[resource]) {
          result.resources[resource] = {};
        }

        if (scope) {
          if (!result.resources[resource][action]) {
            result.resources[resource][action] = {};
          }
          result.resources[resource][action][scope] = perm;
        } else {
          result.resources[resource][action] = perm;
        }
      }
    });

    return result;
  }
}

