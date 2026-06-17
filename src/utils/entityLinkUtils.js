import {
  ENTITY_SHARE_METADATA_TYPE,
  getEntityShareConfig,
  getEntityUrlPatterns,
} from '@/constants/entityShareRegistry';

/**
 * @param {number|string|null|undefined} value
 * @returns {number|null}
 */
export function resolvePositiveEntityId(value) {
  const id = value != null && value !== '' ? Number(value) : NaN;
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * @param {string} entityType
 * @param {number|string} entityId
 * @returns {string|null}
 */
export function buildEntityShareUrl(entityType, entityId) {
  const config = getEntityShareConfig(entityType);
  const id = resolvePositiveEntityId(entityId);
  if (!config || id === null) {
    return null;
  }
  const path = config.routePath(id);
  if (typeof window === 'undefined') {
    return path;
  }
  return `${window.location.origin}${path}`;
}

/**
 * @param {string} entityType
 * @param {object} item
 * @returns {{ type: string, entity: string, entity_id: number, url: string }|null}
 */
export function buildEntityShareRequest(entityType, item) {
  const config = getEntityShareConfig(entityType);
  const id = resolvePositiveEntityId(item?.id);
  if (!config || id === null) {
    return null;
  }
  return {
    type: ENTITY_SHARE_METADATA_TYPE,
    entity: config.entity,
    entity_id: id,
    url: config.routePath(id),
  };
}

/**
 * @typedef {{ kind: 'text', value: string } | { kind: 'entity_link', entity: string, entity_id: number, url: string, raw: string }} MessageBodySegment
 */

/**
 * @param {string} text
 * @returns {MessageBodySegment[]}
 */
export function parseEntityLinksInText(text) {
  if (!text) {
    return [];
  }
  const patterns = getEntityUrlPatterns();
  if (!patterns.length) {
    return [{ kind: 'text', value: text }];
  }

  const matches = [];
  for (const { entity, pattern } of patterns) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    let match;
    while ((match = re.exec(text)) !== null) {
      const entityId = Number(match[1]);
      if (!Number.isFinite(entityId) || entityId <= 0) {
        continue;
      }
      matches.push({
        index: match.index,
        length: match[0].length,
        entity,
        entity_id: entityId,
        raw: match[0],
      });
    }
  }

  if (!matches.length) {
    return [{ kind: 'text', value: text }];
  }

  matches.sort((a, b) => a.index - b.index);
  const deduped = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.index < lastEnd) {
      continue;
    }
    deduped.push(m);
    lastEnd = m.index + m.length;
  }

  const segments = [];
  let cursor = 0;
  for (const m of deduped) {
    if (m.index > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, m.index) });
    }
    const config = getEntityShareConfig(m.entity);
    segments.push({
      kind: 'entity_link',
      entity: m.entity,
      entity_id: m.entity_id,
      url: config ? config.routePath(m.entity_id) : m.raw,
      raw: m.raw,
    });
    cursor = m.index + m.length;
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) });
  }
  return segments;
}

/**
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyTextToClipboard(text) {
  if (!text) {
    throw new Error('clipboard empty text');
  }
  if (!navigator.clipboard?.writeText) {
    throw new Error('clipboard unavailable');
  }
  await navigator.clipboard.writeText(text);
}

/**
 * @param {object|null|undefined} metadata
 * @returns {boolean}
 */
export function isEntityLinkMetadata(metadata) {
  return Boolean(
    metadata
    && metadata.type === ENTITY_SHARE_METADATA_TYPE
    && metadata.entity
    && metadata.entity_id,
  );
}
