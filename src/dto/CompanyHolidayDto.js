import dayjs from 'dayjs';

export default class CompanyHolidayDto {
    constructor(data = {}) {
        this.id = data.id || null;
        this.companyId = data.company_id || null;
        this.name = data.name || '';
        this.date = data.date ? dayjs(data.date).format('YYYY-MM-DD') : null;
        this.color = data.color || '#FF5733';
        this.createdAt = data.created_at || null;
        this.updatedAt = data.updated_at || null;
    }

    toAPI() {
        return {
            name: this.name,
            date: this.date,
            color: this.color,
        };
    }
}

