import { PermissionParser } from './parser';

export function permissionIcon(name) {
  if (name.startsWith('settings_')) {
    const settingsIconMap = {
      'settings_edit_any_date': 'fas fa-pen',
      'settings_project_budget_view': 'fas fa-eye',
      'settings_project_files_view': 'fas fa-eye',
      'settings_project_balance_view': 'fas fa-eye',
      'settings_project_contracts_view': 'fas fa-eye',
      'settings_currencies_view': 'fas fa-eye',
      'settings_cash_balance_view': 'fas fa-eye',
      'settings_client_balance_view': 'fas fa-eye',
      'settings_view': 'fas fa-eye',
    };
    return settingsIconMap[name] || 'fas fa-cog';
  }

  const parsed = PermissionParser.parse(name);
  if (!parsed || !parsed.action) {
    return "fas fa-dot-circle";
  }

  switch (parsed.action) {
    case "view":
      return "fas fa-eye";
    case "create":
      return "fas fa-plus";
    case "update":
      return "fas fa-pen";
    case "delete":
      return "fas fa-trash";
    case "export":
      return "fas fa-file-excel";
    default:
      return "fas fa-dot-circle";
  }
}

export function permissionColor(name) {
  const parsed = PermissionParser.parse(name);
  if (!parsed || !parsed.action) {
    return "text-gray-600";
  }

  switch (parsed.action) {
    case "view":
      return "text-blue-500";
    case "create":
      return "text-green-500";
    case "update":
      return "text-yellow-500";
    case "delete":
      return "text-red-500";
    case "export":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
}

