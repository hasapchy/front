export const DRIVE_LEGACY_ABILITY_LABELS = {
  upload: 'create',
  rename: 'update',
  share: 'update',
};

export const DRIVE_ABILITY_ICONS = {
  view: 'fas fa-eye',
  create: 'fas fa-plus',
  update: 'fas fa-pen',
  delete: 'fas fa-trash',
};

export const DRIVE_ABILITY_ICON_COLORS = {
  view: 'text-[var(--color-info)]',
  create: 'text-[var(--color-success)]',
  update: 'text-[var(--color-warning)]',
  delete: 'text-[var(--color-danger)]',
};

export const DRIVE_FOLDER_ABILITY_VALUES = ['view', 'create', 'update', 'delete'];

export const DRIVE_FILE_ABILITY_VALUES = ['view', 'update', 'delete'];

export const DRIVE_ABILITY_VALUES = DRIVE_FOLDER_ABILITY_VALUES;

export function driveAbilityValuesForResourceType(resourceType) {
  return resourceType === 'file' ? DRIVE_FILE_ABILITY_VALUES : DRIVE_FOLDER_ABILITY_VALUES;
}

export function normalizeDriveAbility(ability) {
  const labelKey = DRIVE_LEGACY_ABILITY_LABELS[ability] || ability;
  return labelKey === 'edit' ? 'update' : labelKey;
}

export function sortDriveAbilities(abilities, resourceType) {
  const order = driveAbilityValuesForResourceType(resourceType);
  const orderMap = Object.fromEntries(order.map((value, index) => [value, index]));
  return (Array.isArray(abilities) ? abilities : [])
    .map((ability) => normalizeDriveAbility(ability))
    .filter((ability, index, list) => orderMap[ability] !== undefined && list.indexOf(ability) === index)
    .sort((left, right) => (orderMap[left] ?? 99) - (orderMap[right] ?? 99));
}

export function expandDriveAbilitiesWithDependencies(abilities, resourceType) {
  const sorted = sortDriveAbilities(abilities, resourceType);
  const hasDependent = sorted.some((ability) => ['create', 'update', 'delete'].includes(ability));
  if (hasDependent && !sorted.includes('view')) {
    return sortDriveAbilities([...sorted, 'view'], resourceType);
  }
  return sorted;
}

export function stripDriveAbilitiesWithoutView(abilities, resourceType) {
  const sorted = sortDriveAbilities(abilities, resourceType);
  if (sorted.includes('view')) {
    return sorted;
  }
  return [];
}

export function removeDriveAbility(abilities, abilityToRemove, resourceType) {
  const normalized = normalizeDriveAbility(abilityToRemove);
  if (normalized === 'view') {
    return [];
  }
  return sortDriveAbilities(
    sortDriveAbilities(abilities, resourceType).filter((ability) => ability !== normalized),
    resourceType
  );
}

export function filterAbilitiesForResourceType(abilities, resourceType) {
  const sorted = expandDriveAbilitiesWithDependencies(abilities, resourceType);
  if (sorted.length) {
    return sorted;
  }
  const allowed = driveAbilityValuesForResourceType(resourceType);
  return [allowed[0] ?? 'view'];
}

export function normalizeDriveAbilityForResource(ability, resourceType) {
  const normalized = normalizeDriveAbility(ability);
  const allowed = driveAbilityValuesForResourceType(resourceType);
  if (allowed.includes(normalized)) {
    return normalized;
  }
  return allowed[0] ?? 'view';
}

export function driveAbilityIconClass(ability) {
  return DRIVE_ABILITY_ICONS[normalizeDriveAbility(ability)] || 'fas fa-shield-halved';
}

export function driveAbilityIconColor(ability) {
  return DRIVE_ABILITY_ICON_COLORS[normalizeDriveAbility(ability)] || 'text-gray-500';
}
