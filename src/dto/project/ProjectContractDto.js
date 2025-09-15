class ProjectContractDto {
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
        this.files = files || [];
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromApi(data) {
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
            data.created_at,
            data.updated_at
        );
    }

    formatAmount() {
        const symbol = this.currencySymbol || '';
        return `${parseFloat(this.amount).toFixed(2)} ${symbol}`;
    }

    formatDate() {
        if (!this.date) return '';
        return new Date(this.date).toLocaleDateString();
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
            files: this.files
        };
    }
}

export default ProjectContractDto;
