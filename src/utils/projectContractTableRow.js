import ProjectContractDto from '@/dto/project/ProjectContractDto';

/**
 * @param {ProjectContractDto|object} contract
 * @returns {ProjectContractDto}
 */
export function enrichProjectContractForTable(contract) {
    const dto = ProjectContractDto.fromObject(contract);

    dto.formatDateUser = function formatDateUser() {
        return `${this.formatDate()} / ${this.creator?.name ?? ''}`;
    };

    dto.formatReturnedStatus = function formatReturnedStatus() {
        const icon = this.returned ? 'fa-solid fa-file-circle-check' : 'fa-solid fa-file-circle-xmark';
        const color = this.returned ? 'var(--color-success)' : 'var(--color-danger)';
        const title = this.getReturnedStatus();
        return `<span style="color:${color}" title="${title}"><i class="${icon}"></i></span>`;
    };

    dto.formatPaidStatus = function formatPaidStatus() {
        const st = this.paymentStatus || (
            (this.paidAmount ?? 0) >= (this.amount ?? 0)
                ? 'paid'
                : ((this.paidAmount ?? 0) > 0 ? 'partially_paid' : 'unpaid')
        );
        const color = st === 'draft'
            ? '#94a3b8'
            : (st === 'paid' ? 'var(--color-success)' : (st === 'partially_paid' ? 'var(--color-warning)' : 'var(--color-danger)'));

        let iconClass = 'fas fa-times-circle';
        if (st === 'draft') {
            iconClass = 'fas fa-file-pen';
        } else if (st === 'paid') {
            iconClass = 'fas fa-check-circle';
        } else if (st === 'partially_paid') {
            iconClass = 'fas fa-adjust';
        }

        const title = this.getPaidStatus();
        return `<span style="color:${color};font-weight:bold" title="${title}"><i class="${iconClass}"></i></span>`;
    };

    return dto;
}

/**
 * @param {ProjectContractDto|object} item
 * @param {string} column
 * @param {{
 *   search?: string,
 *   highlightMatches?: (text: string, search: string) => string,
 *   formatNumber?: (value: number, withDecimals?: boolean) => string,
 *   t?: (key: string) => string,
 *   includePartialPaidAmount?: boolean,
 *   paymentStatusClassResolver?: (item: object) => string,
 * }} [options]
 * @returns {*}
 */
export function mapProjectContractTableColumn(item, column, options = {}) {
    const {
        search = '',
        highlightMatches = (text) => text,
        formatNumber = (value) => String(value),
        t = (key) => key,
        includePartialPaidAmount = false,
        paymentStatusClassResolver = () => '',
    } = options;
    const searchActive = Boolean(search && search.length >= 3);

    switch (column) {
        case 'id':
            return searchActive ? highlightMatches(String(item.id ?? ''), search) : (item.id ?? '');
        case 'client':
            return searchActive && item.clientName ? highlightMatches(item.clientName, search) : item.clientName;
        case 'projectName':
            return searchActive && item.projectName ? highlightMatches(item.projectName, search) : item.projectName;
        case 'number':
            return searchActive && item.number ? highlightMatches(item.number, search) : (item.number ?? '');
        case 'lifecycleStatus':
            return item.status === 'active' ? 1 : 0;
        case 'type':
            return item.type === 1 ? t('cash') : t('cashless');
        case 'amount': {
            const amountStr = item.formatAmount ? item.formatAmount() : String(item.amount ?? '');
            return searchActive && amountStr ? highlightMatches(amountStr, search) : amountStr;
        }
        case 'cashRegisterName':
            return item.cashRegisterName;
        case 'dateUser':
            return item.formatDateUser ? item.formatDateUser() : `${item.formatDate()} / ${item.creator?.name}`;
        case 'returned':
            if (typeof item.formatReturnedStatus === 'function') {
                return item.formatReturnedStatus();
            }
            return item.returned ? 1 : 0;
        case 'paymentStatusText': {
            if (!includePartialPaidAmount && typeof item.formatPaidStatus === 'function') {
                return item.formatPaidStatus();
            }

            const status = item.paymentStatus || (
                (item.paidAmount ?? 0) >= (item.amount ?? 0)
                    ? 'paid'
                    : ((item.paidAmount ?? 0) > 0 ? 'partially_paid' : 'unpaid')
            );

            const cls = paymentStatusClassResolver(item);

            let iconClass = 'fas fa-times-circle';
            if (status === 'draft') {
                iconClass = 'fas fa-file-pen';
            } else if (status === 'paid') {
                iconClass = 'fas fa-check-circle';
            } else if (status === 'partially_paid') {
                iconClass = 'fas fa-adjust';
            }

            const paidAmount = item.paidAmount ?? 0;
            const currencyCode = item.currencyCode ?? '';
            const showAmount = status === 'partially_paid' && paidAmount > 0;
            const formattedAmount = showAmount
                ? `${formatNumber(paidAmount, true)} ${currencyCode}`.trim()
                : '';

            const title = item.paymentStatusText ?? item.getPaidStatus?.() ?? '';

            const amountHtml = showAmount && formattedAmount
                ? `<span class="ml-1">${formattedAmount}</span>`
                : '';

            return `<span class="${cls}" title="${title}"><i class="${iconClass}"></i>${amountHtml}</span>`;
        }
        case 'note':
            return searchActive && item.note ? highlightMatches(item.note, search) : item.note;
        default:
            return item[column];
    }
}
