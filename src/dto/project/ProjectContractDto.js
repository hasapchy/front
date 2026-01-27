import { formatDatabaseDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/numberUtils';
import { createFromApiArray } from '@/utils/dtoUtils';

class ProjectContractDto {
    constructor(
        id,
        projectId,
        number,
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
        projectName
    ) {
        this.id = id;
        this.projectId = projectId;
        this.number = number;
        this.amount = amount;
        this.currencyId = currencyId;
        this.currencyName = currencyName;
        this.currencySymbol = currencySymbol;
        this.cashId = cashId;
        this.cashRegisterName = cashRegisterName;
        this.date = date;
        this.returned = returned;
        this.isPaid = isPaid;
        this.files = files || [];
        this.note = note;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.projectName = projectName || null;
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
        return this.isPaid ? 'Оплачено' : 'Не оплачено';
    }

    toApi() {
        return {
            project_id: this.projectId,
            number: this.number,
            amount: this.amount,
            currency_id: this.currencyId,
            cash_id: this.cashId,
            date: this.date,
            returned: this.returned,
            is_paid: this.isPaid,
            files: this.files,
            note: this.note
        };
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new ProjectContractDto(
                data.id,
                data.project_id || data.projectId,
                data.number,
                data.amount,
                data.currency_id || data.currencyId,
                data.currency_name || data.currencyName,
                data.currency_symbol || data.currencySymbol,
                data.cash_id || data.cashId,
                data.cash_register_name || data.cashRegisterName || (data.cash_register?.name || data.cashRegister?.name || null),
                data.date,
                data.returned,
                data.is_paid || data.isPaid,
                data.files,
                data.note,
                data.created_at || data.createdAt,
                data.updated_at || data.updatedAt,
                data.project_name || data.projectName || (data.project?.name || null)
            );
        }).filter(Boolean);
    }
}

export default ProjectContractDto;
