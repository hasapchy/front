import { getClientDisplayName } from '@/utils/displayUtils';
import { formatInlineLabel } from '@/utils/fieldPickerUtils';

export function getReceiptSupplierLabel(receipt, t) {
    return getClientDisplayName(receipt.client) || t('notSpecified');
}

export function getReceiptAmountLabel(receipt) {
    return receipt.priceInfo();
}

export function getReceiptOptionSub(receipt) {
    return formatInlineLabel(
        `#${receipt.id}`,
        formatInlineLabel(receipt.warehouseName, receipt.formatDate()),
    );
}
