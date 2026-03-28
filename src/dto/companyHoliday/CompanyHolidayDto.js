import dayjs from 'dayjs';

export default class CompanyHolidayDto {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.companyId = data.company_id ?? null;
        this.name = data.name ;
        this.date = data.date ? dayjs(data.date).format('YYYY-MM-DD') : null;
        this.endDate = data.end_date ? dayjs(data.end_date).format('YYYY-MM-DD') : null;
        this.isRecurring = data.is_recurring !== undefined ? data.is_recurring : true;
        this.color = data.color ?? '#FF5733';
        this.createdAt = data.created_at ?? null;
        this.updatedAt = data.updated_at ?? null;
    }

    toAPI() {
        return {
            name: this.name,
            date: this.date,
            end_date: this.endDate ?? null,
            is_recurring: this.isRecurring,
            color: this.color,
        };
    }

    static fromApi(data) {
        if (!data) return null;
        return new CompanyHolidayDto(data);
    }

    static fromApiArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map(item => CompanyHolidayDto.fromApi(item)).filter(Boolean);
    }
}

