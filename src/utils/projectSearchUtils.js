import { getClientDisplayName } from '@/utils/displayUtils';
import { formatInlineLabel } from '@/utils/fieldPickerUtils';
import { translateProjectStatus } from '@/utils/translationUtils';

export function getProjectDisplayTitle(project) {
  const name = typeof project?.name === 'string' ? project.name.trim() : '';
  return name || '-';
}

export function getProjectClientLabel(project, t) {
  const name = getClientDisplayName(project?.client);
  return name || t('notSpecified');
}

export function getProjectStatusColor(project) {
  return project?.status?.color ?? '#6c757d';
}

export function getProjectStatusLabel(project, t) {
  const name = project?.status?.name ?? project?.statusName ?? '';
  if (!name) {
    return '';
  }
  return translateProjectStatus(name, t);
}

export function getProjectStatusBadgeStyle(project) {
  return {
    backgroundColor: getProjectStatusColor(project),
    color: '#ffffff',
  };
}

export function getProjectOptionPrimary(project, t) {
  return formatInlineLabel(
    getProjectDisplayTitle(project),
    getProjectClientLabel(project, t),
  );
}

export function filterProjectsForSelect(projects, { activeOnly = true, clientId = null } = {}) {
  let list = Array.isArray(projects) ? projects : [];
  if (activeOnly) {
    list = list.filter((p) => !p.status || p.status.isVisible !== false);
  }
  if (clientId != null && clientId !== '') {
    list = list.filter((p) => Number(p.clientId) === Number(clientId));
  }
  return list;
}

function canAssignProjectId(target) {
  if (!('projectId' in target)) {
    return false;
  }
  const props = target.$options?.props;
  if (!props) {
    return true;
  }
  if (Array.isArray(props)) {
    return !props.includes('projectId');
  }
  if (typeof props === 'object') {
    return !Object.prototype.hasOwnProperty.call(props, 'projectId');
  }
  return true;
}

export function applyProjectSelection(target, project) {
  target.selectedProject = project ?? null;
  const id = project?.id ?? '';
  const normalizedId = id || null;

  if ('selectedProjectId' in target) {
    target.selectedProjectId = normalizedId;
    return;
  }
  if (target.form && 'projectId' in target.form) {
    target.form.projectId = id;
    return;
  }
  if (canAssignProjectId(target)) {
    target.projectId = id;
  }
}
