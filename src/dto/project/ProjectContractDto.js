import { formatDatabaseDate } from '@/utils/dateUtils';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import { createFromApiArray } from '@/utils/dtoUtils';
import { getCashRegisterDisplayNameByParts } from '@/utils/cashRegisterUtils';
import ClientDto from '@/dto/client/ClientDto';
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
        currencyCode,
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
        clientBalanceId = null,
        status = 'active'
    ) {
        this.id = id;
        this.projectId = projectId;
        this.status = status ?? 'active';
        this.number = number;
        this.type = type;
        this.amount = amount;
        this.currencyId = currencyId;
        this.currencyName = currencyName;
        this.currencyCode = currencyCode;
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
        return formatCurrencyForDisplay(this.amount ?? 0, this.currencyCode, true);
    }

    formatDate() {
        return formatDatabaseDate(this.date);
    }

    getReturnedStatus() {
        return this.returned ? dt('contractSigned') : dt('contractNotSigned');
    }

    isDraft() {
        return this.status === 'draft';
    }

    getPaidStatus() {
        if (this.isDraft()) {
            return dt('contractStatusDraft');
        }
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
            status: this.status ?? 'draft',
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
            obj.currencyCode,
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
            obj.clientBalanceId ?? null,
            obj.status ?? 'active'
        );

        ProjectContractDto.attachClient(dto, obj);

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
            data.client_balance_id ?? null,
            data.status ?? 'active'
        );

        ProjectContractDto.attachClient(dto, data);

        return dto;
    }

    /**
     * @param {ProjectContractDto} dto
     * @param {object} data
     */
    static attachClient(dto, data) {
        const client = ProjectContractDto.clientFromData(data);
        if (!client) {
            return;
        }

        dto.clientId = client.id;
        dto.client = client;
        dto.clientName = ProjectContractDto.resolveClientName(data);
    }

    /**
     * @param {object} data
     * @returns {ClientDto|null}
     */
    static clientFromData(data) {
        if (!data) {
            return null;
        }

        if (data.client instanceof ClientDto) {
            return data.client;
        }

        const clientId = data.client_id ?? data.clientId ?? data.client?.id ?? null;
        if (clientId === null || clientId === undefined) {
            return null;
        }

        const raw = data.client ? { ...data.client } : { id: clientId };
        raw.id = raw.id ?? clientId;
        raw.first_name = raw.first_name ?? raw.firstName ?? data.client_first_name ?? data.clientFirstName ?? null;
        raw.last_name = raw.last_name ?? raw.lastName ?? data.client_last_name ?? data.clientLastName ?? null;
        raw.client_type = raw.client_type ?? raw.clientType ?? data.client_type ?? data.clientType ?? null;

        if (raw.name && !raw.first_name && !raw.last_name) {
            raw.first_name = raw.name;
        }
        if (!raw.first_name && !raw.last_name) {
            const resolvedName = data.client_name ?? data.clientName;
            if (resolvedName) {
                raw.first_name = resolvedName;
            }
        }

        return ClientDto.fromApi(raw);
    }

    static resolveClientName(data) {
        if (!data) return '';
        const client = data.client ?? null;
        const direct = data.clientName ?? data.client_name ?? client?.clientName ?? client?.client_name ?? client?.name ?? client?.fullName ?? client?.full_name;
        if (direct) return String(direct).trim();

        const first = data.clientFirstName ?? data.client_first_name ?? client?.firstName ?? client?.first_name ?? '';
        const last = data.clientLastName ?? data.client_last_name ?? client?.lastName ?? client?.last_name ?? '';
        return [first, last].filter(Boolean).join(' ').trim();
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, ProjectContractDto.fromApi).filter(Boolean);
    }
}

export default ProjectContractDto;
