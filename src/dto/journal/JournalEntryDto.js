import { formatCurrencyForDisplay } from '@/utils/numberUtils';

export default class JournalEntryDto {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.entryNumber = data.entry_number ?? data.entryNumber ?? null;
        this.entryDate = data.entry_date ?? data.entryDate ?? null;
        this.description = data.description ?? '';
        this.status = data.status ?? 'draft';
        this.templateKey = data.template_key ?? data.templateKey ?? null;
        this.sourceType = data.source_type ?? data.sourceType ?? null;
        this.sourceId = data.source_id ?? data.sourceId ?? null;
        this.meta = data.meta ?? null;
        this.postedAt = data.posted_at ?? data.postedAt ?? null;
        this.creatorId = data.created_by ?? data.creatorId ?? null;
        this.lines = (data.lines ?? []).map((line) => this.mapLine(line));
        this.displayName = this.entryNumber || `#${this.id}`;
    }

    /**
     * @param {object} line
     * @returns {object}
     */
    mapLine(line) {
        return {
            ...line,
            account_code: line.account_code ?? line.accountCode ?? '',
            account_name: line.account_name ?? line.accountName ?? '',
            debit: Number(line.debit ?? 0),
            credit: Number(line.credit ?? 0),
        };
    }

    /**
     * @param {(key: string) => string} t
     * @returns {string}
     */
    statusLabel(t) {
        return t(`journalEntryStatus.${this.status}`);
    }

    /**
     * @param {(key: string) => string} t
     * @returns {string}
     */
    templateKeyLabel(t) {
        if (!this.templateKey) {
            return '';
        }
        const key = `journalEntryTemplate.${this.templateKey}`;
        return t(key) !== key ? t(key) : this.templateKey;
    }

    /**
     * @returns {string}
     */
    entryDateFormatted() {
        return this.entryDate ?? '';
    }

    /**
     * @param {(key: string) => string} t
     * @returns {Array<object>}
     */
    lineDisplayRows(t) {
        return this.lines.map((line) => ({
            ...line,
            accountLabel: `${line.account_code} — ${line.account_name}`,
            debitFormatted: formatCurrencyForDisplay(line.debit, '', true),
            creditFormatted: formatCurrencyForDisplay(line.credit, '', true),
        }));
    }

    static fromApi(data) {
        if (!data) {
            return null;
        }
        return new JournalEntryDto(data);
    }

    static fromApiArray(items) {
        return (items ?? []).map((item) => JournalEntryDto.fromApi(item)).filter(Boolean);
    }
}
