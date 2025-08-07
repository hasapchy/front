class SettingsDto {
    constructor(data = {}) {
        this.company_name = data.company_name || '';
        this.company_logo = data.company_logo || '';
    }
}

export default SettingsDto;