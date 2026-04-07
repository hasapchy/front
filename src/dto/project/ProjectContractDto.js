import { formatDatabaseDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/numberUtils';
import { createFromApiArray } from '@/utils/dtoUtils';
import { getCashRegisterDisplayNameByParts } from '@/utils/cashRegisterUtils';
import i18n from '@/i18n';
import { dt } from '@/utils/displayI18n';

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
        creator,
        clientBalanceId = null
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
        this.projectName = projectName ?? null;
        this.paidAmount = paidAmount ?? 0;
        this.paymentStatus = paymentStatus ?? 'unpaid';
        this.paymentStatusText = paymentStatusText ?? null;
        this.creator = creator ?? null;
        this.clientBalanceId = clientBalanceId;
    }


    formatAmount() {
        return formatCurrency(this.amount ?? 0, this.currencySymbol , null, true);
    }

    formatDate() {
        return formatDatabaseDate(this.date);
    }

    getReturnedStatus() {
        return this.returned ? dt('contractSigned') : dt('contractNotSigned');
    }

    getPaidStatus() {
        if (this.paymentStatusText) return this.paymentStatusText;
        const paid = (this.paidAmount ?? 0) >= (this.amount ?? 0);
        return paid ? dt('contractPaid') : ((this.paidAmount ?? 0) > 0 ? dt('contractPartiallyPaid') : i18n.global.t('unpaid'));
    }

    toApi() {
        return {
            project_id: this.projectId,
            client_id: this.clientId ?? null,
            number: this.number,
            type: this.type,
            amount: this.amount,
            currency_id: this.currencyId,
            cash_id: this.cashId,
            date: this.date,
            returned: this.returned,
            files: this.files?.length ? this.files : null,
            note: this.note,
            client_balance_id: this.clientBalanceId ?? null,
        };
    }

    static fromObject(obj) {
        if (!obj) return null;
        if (obj instanceof ProjectContractDto) return obj;

        const dto = new ProjectContractDto(
            obj.id,
            obj.projectId,
            obj.number,
            obj.type !== undefined ? obj.type : 0,
            obj.amount,
            obj.currencyId,
            obj.currencyName,
            obj.currencySymbol,
            obj.cashId,
            obj.cashRegisterName,
            obj.date,
            obj.returned,
            obj.isPaid,
            obj.files,
            obj.note,
            obj.createdAt,
            obj.updatedAt,
            obj.projectName,
            obj.paidAmount,
            obj.paymentStatus,
            obj.paymentStatusText,
            obj.creator ?? null,
            obj.clientBalanceId ?? null
        );

        if (obj.clientId !== undefined && obj.clientId !== null) {
            dto.clientId = obj.clientId;
            dto.clientName = obj.clientName ?? '';
        }

        return dto;
    }

    static fromApi(data) {
        if (!data) return null;
        const dto = new ProjectContractDto(
            data.id,
            data.project_id,
            data.number,
            data.type !== undefined ? data.type : 0,
            data.amount,
            data.currency_id,
            data.currency_name,
            data.currency_symbol,
            data.cash_id,
            getCashRegisterDisplayNameByParts(
                data.cash_register_name,
                data.cash_register?.is_cash ?? (Number(data.type) === 1)
            ),
            data.date,
            data.returned,
            data.is_paid,
            data.files,
            data.note,
            data.created_at,
            data.updated_at,
            data.project_name,
            data.paid_amount,
            data.payment_status,
            data.payment_status_text,
            data.creator ?? null,
            data.client_balance_id ?? null
        );

        if (data.client_id !== undefined && data.client_id !== null) {
            dto.clientId = data.client_id;
            const fn = data.client_first_name ?? '';
            const ln = data.client_last_name ?? '';
            dto.clientName = `${fn} ${ln}`.trim();
        }

        return dto;
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, ProjectContractDto.fromApi).filter(Boolean);
    }
}

export default ProjectContractDto;
