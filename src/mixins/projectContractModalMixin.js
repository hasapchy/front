import ProjectContractController from '@/api/ProjectContractController';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';

export default {
    mixins: [notificationMixin, getApiErrorMessageMixin],
    data() {
        return {
            contractModalOpen: false,
            editingContractItem: null,
            contractLoading: false,
        };
    },
    methods: {
        onContractModalBeforeOpen() {},
        onContractModalClose() {},
        onContractSaved() {},
        async handleContractClick(item) {
            try {
                this.onContractModalBeforeOpen();
                this.contractLoading = true;
                const contractItem = await ProjectContractController.getItem(item.id);
                this.editingContractItem = contractItem;
                this.contractModalOpen = true;
            } catch (error) {
                const msg = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
            } finally {
                this.contractLoading = false;
            }
        },
        showAddContractModal() {
            this.onContractModalBeforeOpen();
            this.editingContractItem = null;
            this.contractModalOpen = true;
        },
        async handleRefreshContract() {
            if (!this.editingContractItem?.id) {
                return;
            }

            const updated = await ProjectContractController.getItem(this.editingContractItem.id);
            this.editingContractItem = updated;
            if (typeof this.refreshTimelineIfVisible === 'function') {
                this.refreshTimelineIfVisible();
            }
        },
        closeContractModal() {
            this.contractModalOpen = false;
            this.editingContractItem = null;
            this.onContractModalClose();
        },
        handleContractSaved() {
            this.closeContractModal();
            this.onContractSaved();
        },
        handleContractSavedError(error) {
            const msg = this.getApiErrorMessage(error);
            const text = Array.isArray(msg) ? msg.join(', ') : msg;
            this.showNotification(this.$t('error'), text, true);
        },
        handleContractDeleted() {
            this.closeContractModal();
            this.onContractSaved();
        },
        handleContractDeletedError(error) {
            const msg = this.getApiErrorMessage(error);
            const text = Array.isArray(msg) ? msg.join(', ') : msg;
            this.showNotification(this.$t('error'), text, true);
        },
    },
};
