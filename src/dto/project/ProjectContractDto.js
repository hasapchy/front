import { formatCurrency } from '@/utils/numberUtils';
import { createFromApiArray } from '@/utils/dtoUtils';
import BaseDto from "@/dto/BaseDto";

export default class ProjectContractDto extends BaseDto {
    constructor(
        id,
        projectId,
        number,
        amount,
        currencyId,
        currencyName,
        currencyCode,
        currencySymbol,
        date,
        returned,
        files,
        note,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.number = number;
        this.amount = amount;
        this.currencyId = currencyId;
        this.currencyName = currencyName;
        this.currencyCode = currencyCode;
        this.currencySymbol = currencySymbol;
        this.date = date;
        this.returned = returned;
        this.files = files ?? [];
        this.note = note;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }


    formatAmount() {
        return formatCurrency(this.amount ?? 0, this.currencySymbol ?? '', null, true);
    }

    getReturnedStatus() {
        return this.returned ? 'Возвращен' : 'Не возвращен';
    }

    toApi() {
        return {
            project_id: this.projectId,
            number: this.number,
            amount: this.amount,
            currency_id: this.currencyId,
            date: this.date,
            returned: this.returned,
            files: this.files,
            note: this.note
        };
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new ProjectContractDto(
                data.id,
                data.project_id,
                data.number,
                data.amount,
                data.currency_id,
                data.currency_name,
                data.currency_code,
                data.currency_symbol,
                data.date,
                data.returned,
                data.files,
                data.note,
                data.created_at,
                data.updated_at
            );
        });
    }
}
