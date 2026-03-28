import BaseController from './BaseController';

export default class UserCompanyController extends BaseController {
    static async getCurrentCompany() {
        return super.getData('/user/current-company');
    }

    static async setCurrentCompany(companyId) {
        return super.postData('/user/set-company', { companyId });
    }

    static async getUserCompanies() {
        return super.getData('/user/companies');
    }
}
