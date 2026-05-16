import ProjectContractController from '@/api/ProjectContractController';
import { enrichProjectContractForTable } from '@/utils/projectContractTableRow';

/**
 * @param {object} item
 * @param {number|string} contractId
 * @param {string} field
 * @param {*} value
 * @returns {Promise<{ ok: boolean, error?: unknown }>}
 */
export async function patchProjectContractTableField(item, contractId, field, value) {
    const oldValue = item[field];
    item[field] = value;

    try {
        const response = await ProjectContractController.updateItem(contractId, {
            ...item,
            [field]: value,
        });
        const updated = response?.item;
        if (updated) {
            Object.assign(item, enrichProjectContractForTable({
                ...item,
                ...updated,
                projectName: updated.projectName || item.projectName,
            }));
        }
        return { ok: true };
    } catch (error) {
        item[field] = oldValue;
        return { ok: false, error };
    }
}
