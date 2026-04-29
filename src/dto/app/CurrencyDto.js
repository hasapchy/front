import { createFromApiArray } from '@/utils/dtoUtils';
import { dtoDateFormatters } from '@/utils/dateUtils';
import { EXCHANGE_RATE_DECIMAL_PLACES } from '@/constants/exchangeRateDecimals';
import { formatNumber } from '@/utils/numberUtils';

class CurrencyDto {
    constructor({
        id,
        code,
        name,
        symbol,
        is_default,
        is_report,
        status,
        company_id,
        is_global,
        current_exchange_rate,
        rate_start_date,
    }) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.symbol = symbol;
        this.isDefault = is_default;
        this.isReport = is_report;
        this.status = status;
        this.companyId = company_id ?? null;
        this.isGlobal = is_global ?? this.companyId == null;
        this.currentExchangeRate =
            current_exchange_rate !== undefined && current_exchange_rate !== null
                ? Number(current_exchange_rate)
                : null;
        this.rateStartDate = rate_start_date ?? null;
    }

    formatCurrentExchangeRate() {
        if (this.currentExchangeRate == null || Number.isNaN(this.currentExchangeRate)) {
            return '—';
        }
        return formatNumber(this.currentExchangeRate, EXCHANGE_RATE_DECIMAL_PLACES, true);
    }

    formatRateStartDate() {
        if (!this.rateStartDate) {
            return '—';
        }
        return dtoDateFormatters.formatCreatedAt(this.rateStartDate);
    }

    formatScope(translate) {
        return this.isGlobal ? translate('currencyScopeGlobal') : translate('currencyScopeCompany');
    }

    formatStatusActive(translate) {
        const active = this.status === 1 || this.status === true;
        return active ? translate('active') : translate('inactive');
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new CurrencyDto({
                id: data.id,
                code: data.code,
                name: data.name,
                symbol: data.symbol,
                is_default: data.is_default,
                is_report: data.is_report,
                status: data.status,
                company_id: data.company_id,
                is_global: data.is_global,
                current_exchange_rate: data.current_exchange_rate,
                rate_start_date: data.rate_start_date,
            });
        }).filter(Boolean);
    }
}

export default CurrencyDto;
