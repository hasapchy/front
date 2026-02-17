import { formatDatabaseDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/numberUtils';
import { createFromApiArray } from '@/utils/dtoUtils';

class ProjectContractDto {
    constructor(
        id,
        projectId,
        number,
        type,
        amount,
        currencyId,
        currencyName,
        currencySymbol,
        cashId,
        cashRegisterName,
        date,
        returned,
        isPaid,
        files,
        note,
        createdAt,
        updatedAt,
        projectName,
        paidAmount,
        paymentStatus,
        paymentStatusText,
        userName
    ) {
        this.id = id;
        this.projectId = projectId;
        this.number = number;
        this.type = type;
        this.amount = amount;
        this.currencyId = currencyId;
        this.currencyName = currencyName;
        this.currencySymbol = currencySymbol;
        this.cashId = cashId;
        this.cashRegisterName = cashRegisterName;
        this.date = date;
        this.returned = returned;
        this.isPaid = isPaid;
        this.files = files?.length ? files : null;
        this.note = note;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.projectName = projectName || null;
        this.paidAmount = paidAmount ?? 0;
        this.paymentStatus = paymentStatus || 'unpaid';
        this.paymentStatusText = paymentStatusText || null;
        this.userName = userName || null;
    }


    formatAmount() {
        return formatCurrency(this.amount || 0, this.currencySymbol || '', null, true);
    }

    formatDate() {
        return formatDatabaseDate(this.date);
    }

    getReturnedStatus() {
        return this.returned ? 'Возвращен' : 'Не возвращен';
    }

    getPaidStatus() {
        if (this.paymentStatusText) return this.paymentStatusText;
        const paid = (this.paidAmount ?? 0) >= (this.amount ?? 0);
        return paid ? 'Оплачено' : ((this.paidAmount ?? 0) > 0 ? 'Частично оплачено' : 'Не оплачено');
    }

    toApi() {
        return {
            project_id: this.projectId,
            number: this.number,
            type: this.type,
            amount: this.amount,
            currency_id: this.currencyId,
            cash_id: this.cashId,
            date: this.date,
            returned: this.returned,
            files: this.files?.length ? this.files : null,
            note: this.note
        };
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            const dto = new ProjectContractDto(
                data.id,
                data.project_id || data.projectId,
                data.number,
                data.type !== undefined ? data.type : 0,
                data.amount,
                data.currency_id || data.currencyId,
                data.currency_name || data.currencyName,
                data.currency_symbol || data.currencySymbol || data.currency?.symbol,
                data.cash_id || data.cashId,
                data.cash_register_name || data.cashRegisterName || (data.cash_register?.name || data.cashRegister?.name || null),
                data.date,
                data.returned,
                data.is_paid || data.isPaid,
                data.files,
                data.note,
                data.created_at || data.createdAt,
                data.updated_at || data.updatedAt,
                data.project_name || data.projectName || (data.project?.name || null),
                data.paid_amount ?? data.paidAmount,
                data.payment_status || data.paymentStatus,
                data.payment_status_text || data.paymentStatusText,
                data.creator_name ?? data.creatorName ?? data.creator?.name ?? null
            );
            if (data.client_id) {
                dto.clientId = data.client_id;
                const fn = data.client_first_name ?? data.clientFirstName ?? '';
                const ln = data.client_last_name ?? data.clientLastName ?? '';
                dto.clientName = `${fn} ${ln}`.trim() || '-';
            }
            return dto;
        }).filter(Boolean);
    }
}

export default ProjectContractDto;
