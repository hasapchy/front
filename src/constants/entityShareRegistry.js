export const ENTITY_SHARE_METADATA_TYPE = 'entity_link';

/**
 * @typedef {object} EntityShareConfig
 * @property {string} entity
 * @property {(id: number|string) => string} routePath
 * @property {string} routeName
 * @property {RegExp} urlPattern
 * @property {string} icon
 */

/** @type {Record<string, EntityShareConfig>} */
export const ENTITY_SHARE_REGISTRY = {
  transaction: {
    entity: 'transaction',
    routePath: (id) => `/transactions/${id}`,
    routeName: 'TransactionView',
    urlPattern: /(?:https?:\/\/[^/\s]+)?\/transactions\/(\d+)/g,
    icon: 'fas fa-exchange-alt',
  },
  order: {
    entity: 'order',
    routePath: (id) => `/orders/${id}`,
    routeName: 'OrderView',
    urlPattern: /(?:https?:\/\/[^/\s]+)?\/orders\/(\d+)/g,
    icon: 'fas fa-clipboard-list',
  },
  project: {
    entity: 'project',
    routePath: (id) => `/projects/${id}`,
    routeName: 'ProjectView',
    urlPattern: /(?:https?:\/\/[^/\s]+)?\/projects\/(\d+)/g,
    icon: 'fas fa-diagram-project',
  },
};

/**
 * @param {string} entityType
 * @returns {EntityShareConfig|null}
 */
export function getEntityShareConfig(entityType) {
  if (!entityType) {
    return null;
  }
  return ENTITY_SHARE_REGISTRY[entityType] ?? null;
}

/**
 * @returns {Array<{ entity: string, pattern: RegExp }>}
 */
export function getEntityUrlPatterns() {
  return Object.values(ENTITY_SHARE_REGISTRY).map((config) => ({
    entity: config.entity,
    pattern: new RegExp(config.urlPattern.source, config.urlPattern.flags.replace('g', '')),
  }));
}
