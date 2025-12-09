import { PermissionParser } from './parser';
import { PERMISSIONS_CONFIG } from './config';

export function isAdmin(user) {
  if (!user) {
    return false;
  }
  return user.isAdmin === true || user.is_admin === true || user.is_admin === 1;
}

export function hasPermission(permissionName, userPermissions, user = null) {
  if (!permissionName) {
    return true;
  }

  if (user && isAdmin(user)) {
    return true;
  }

  if (!Array.isArray(userPermissions)) {
    return false;
  }

  const parsed = PermissionParser.parse(permissionName);

  if (!parsed) {
    return userPermissions.includes(permissionName);
  }

  if (parsed.type === 'custom') {
    if (parsed.category === 'settings') {
      return userPermissions.includes(permissionName);
    }

    if (parsed.category === 'resource_custom' && parsed.resource) {
      const config = PERMISSIONS_CONFIG.resources[parsed.resource];
      if (config?.custom_permissions) {
        if (parsed.action) {
          const customPermName = config.custom_permissions[parsed.action];
          if (customPermName) {
            return userPermissions.includes(customPermName);
          }
        }
        return Object.values(config.custom_permissions).some((p) =>
          userPermissions.includes(p)
        );
      }
    }

    return userPermissions.includes(permissionName);
  }

  if (parsed.type === 'standard') {
    const { resource, action, scope } = parsed;

    if (scope) {
      return userPermissions.includes(permissionName);
    }

    const config = PERMISSIONS_CONFIG.resources[resource];
    if (config?.custom_permissions && action === 'view') {
      const hasAnyCustomPermission = Object.values(config.custom_permissions).some((p) =>
        userPermissions.includes(p)
      );
      if (hasAnyCustomPermission) {
        return true;
      }
    }

    const allPerm = PermissionParser.generate(resource, action, 'all');
    const ownPerm = PermissionParser.generate(resource, action, 'own');
    const legacyPerm = PermissionParser.generate(resource, action);

    return (
      userPermissions.includes(allPerm) ||
      userPermissions.includes(ownPerm) ||
      userPermissions.includes(legacyPerm) ||
      userPermissions.includes(permissionName)
    );
  }

  return userPermissions.includes(permissionName);
}

