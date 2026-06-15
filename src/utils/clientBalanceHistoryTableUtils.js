import { highlightMatches } from '@/utils/searchUtils';

export function mapBalanceHistoryTableCell(item, columnName, translateFn, search = '') {
  switch (columnName) {
    case 'id': {
      const idValue = String(item.sourceId ?? item.id ?? '-');
      return search ? highlightMatches(idValue, search) : idValue;
    }
    case 'dateUser': {
      const datePart = item.dateUser || (typeof item.formatDate === 'function' ? item.formatDate() : '');
      const creatorName = item.creator?.name ?? '';
      if (!creatorName) {
        return search ? highlightMatches(datePart, search) : datePart;
      }
      const dateHtml = search ? highlightMatches(datePart, search) : datePart;
      const creatorHtml = search ? highlightMatches(creatorName, search) : creatorName;
      return `${dateHtml} / ${creatorHtml}`;
    }
    case 'creatorName': {
      const creatorName = item.creator?.name ?? '';
      return search ? highlightMatches(creatorName, search) : creatorName;
    }
    case 'note':
      if (!item.note) {
        return '';
      }
      return search ? highlightMatches(item.note, search) : item.note;
    case 'categoryName': {
      const categoryName = item.categoryName;
      const categoryLabel = categoryName && translateFn
        ? translateFn(`transactionCategory.${categoryName}`, categoryName)
        : categoryName ?? '';
      return search ? highlightMatches(categoryLabel, search) : categoryLabel;
    }
    case 'projectName': {
      const projectName = item.projectName ?? '';
      return search ? highlightMatches(projectName, search) : projectName;
    }
    case 'clientImpact':
      return parseFloat(item.amount || 0);
    default:
      return item[columnName];
  }
}
