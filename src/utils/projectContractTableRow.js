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
        const color = this.returned ? '#5CB85C' : '#EE4F47';
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
            : (st === 'paid' ? '#5CB85C' : (st === 'partially_paid' ? '#FFA500' : '#EE4F47'));

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
