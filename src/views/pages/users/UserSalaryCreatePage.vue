<template>
    <div>
        <div class="flex flex-col overflow-auto h-full p-4">
            <h2 class="text-lg font-bold mb-4">
                {{ editingItemId ? $t('editSalary') : $t('addSalary') }}
            </h2>

            <div class="space-y-4 flex-1">
                <div>
                    <label class="required">{{ $t('startDate') }}</label>
                    <input type="date" v-model="form.start_date" required />
                </div>

                <div>
                    <label>{{ $t('endDate') }}</label>
                    <input type="date" v-model="form.end_date" />
                </div>

                <div>
                    <label class="required">{{ $t('amount') }}</label>
                    <input type="number" v-model.number="form.amount" step="0.01" min="0" required />
                </div>

                <div>
                    <label class="required">{{ $t('currency') }}</label>
                    <select v-model.number="form.currency_id" required>
                        <option :value="null">{{ $t('selectCurrency') }}</option>
                        <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                            {{ currency.code }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="required">{{ $t('salaryPaymentType') }}</label>
                    <select v-model="form.payment_type" required>
                        <option :value="false">{{ $t('salaryPaymentTypeNonCash') }}</option>
                        <option :value="true">{{ $t('salaryPaymentTypeCash') }}</option>
                    </select>
                </div>

                <div>
                    <label>{{ $t('note') }}</label>
                    <textarea v-model="form.note" rows="3" class="w-full"></textarea>
                </div>
            </div>
        </div>
        <teleport v-bind="sideModalFooterTeleportBind">
            <div class="flex w-full flex-wrap items-center gap-2">
                <PrimaryButton
                    v-if="editingItemId != null"
                    :onclick="showDeleteDialog"
                    :is-danger="true"
                    :is-loading="deleteLoading"
                    icon="fas fa-trash"
                    :disabled="!canDelete"
                />
                <PrimaryButton
                    icon="fas fa-save"
                    :onclick="save"
                    :is-loading="saveLoading"
                    :disabled="!canSave || saveLoading"
                />
            </div>
        </teleport>
        <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('confirmDelete')"
            :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
        <AlertDialog :dialog="overlapDialog" @confirm="confirmOverlapAndSave" @leave="closeOverlapDialog"
            :descr="overlapDialogDescr" :confirm-text="$t('create')" :leave-text="$t('cancel')"
            :confirm-loading="saveLoading" />
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UsersController from '@/api/UsersController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
    mixins: [notificationMixin, getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    components: {
        PrimaryButton,
        AlertDialog,
    },
    props: {
        editingItem: {
            type: Object,
            default: null
        },
        userId: {
            type: [Number, String],
            required: true
        },
        usersController: {
            type: Object,
            default: null
        }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    data() {
        return {
            form: {
                start_date: '',
                end_date: '',
                amount: 0,
                currency_id: null,
                payment_type: false,
                note: '',
            },
            currencies: [],
            overlapDialog: false,
            pendingSaveData: null,
        };
    },
    computed: {
        overlapDialogDescr() {
            return this.$t('salaryOverlapConfirm');
        },
        controller() {
            return this.usersController || UsersController;
        },
        canSave() {
            if (!this.form.start_date || !this.form.currency_id || !this.form.amount) {
                return false;
            }
            if (this.editingItemId && this.isInactiveSalary) {
                return false;
            }
            if (this.editingItemId) {
                return this.$store.getters.hasPermission('employee_salaries_update_all')
                    || this.$store.getters.hasPermission('employee_salaries_update_own');
            }
            return this.$store.getters.hasPermission('employee_salaries_create');
        },
        canDelete() {
            if (this.isInactiveSalary) {
                return false;
            }
            return this.editingItemId != null && (
                this.$store.getters.hasPermission('employee_salaries_delete_all') ||
                this.$store.getters.hasPermission('employee_salaries_delete_own')
            );
        },
        isInactiveSalary() {
            return Boolean(this.editingItemId && this.form.end_date);
        },
    },
    mounted() {
        void this.editingItem;
        this.$nextTick(async () => {
            await this.fetchCurrencies();
            this.saveInitialState();
        });
    },
    methods: {
        async fetchCurrencies() {
            try {
                const fromStore = this.$store.getters.currencies;
                if (!fromStore?.length) {
                    await this.$store.dispatch('loadCurrencies');
                }
                this.currencies = this.$store.getters.currencies || [];
                if (!this.editingItemId && !this.form.currency_id) {
                    const def = this.currencies.find((c) => c.isDefault);
                    if (def) {
                        this.form.currency_id = def.id;
                    }
                }
            } catch {
                this.currencies = [];
            }
        },
        clearForm() {
            const defaultCurrency = this.currencies.find(c => c.isDefault);
            this.form = {
                start_date: '',
                end_date: '',
                amount: 0,
                currency_id: defaultCurrency ? defaultCurrency.id : null,
                payment_type: false,
                note: '',
            };
            this.resetFormChanges();
        },
        prepareSave() {
            const payload = { ...this.form };
            if (payload.end_date === '') {
                payload.end_date = null;
            }
            return payload;
        },
        async performSave(data) {
            if (this.editingItemId) {
                return await this.controller.updateSalary(
                    this.userId,
                    this.editingItemId,
                    data
                );
            } else {
                return await this.controller.createSalary(this.userId, data);
            }
        },
        async save() {
            if (this.saveLoading || !this.canSave) {
                return;
            }
            this.saveLoading = true;
            const payload = this.prepareSave();
            try {
                const response = await this.performSave(payload);
                this.$emit('saved', response);
                this.onSaveSuccess();
            } catch (error) {
                const res = error.response;
                const overlap = !this.editingItemId
                    && res?.status === 422
                    && res.data?.code === 'salary_overlap';
                if (overlap) {
                    this.pendingSaveData = payload;
                    this.overlapDialog = true;
                } else {
                    this.emitSavedError(error);
                    this.onSaveError(error);
                }
            } finally {
                this.saveLoading = false;
            }
        },
        closeOverlapDialog() {
            this.overlapDialog = false;
            this.pendingSaveData = null;
        },
        async confirmOverlapAndSave() {
            const pending = this.pendingSaveData;
            if (!pending) {
                this.closeOverlapDialog();
                return;
            }
            this.saveLoading = true;
            try {
                const response = await this.controller.createSalary(this.userId, {
                    ...pending,
                    is_close: true,
                });
                this.closeOverlapDialog();
                this.$emit('saved', response);
                this.onSaveSuccess(response);
            } catch (error) {
                this.emitSavedError(error);
                this.onSaveError(error);
            } finally {
                this.saveLoading = false;
            }
        },
        async performDelete() {
            return await this.controller.deleteSalary(this.userId, this.editingItemId);
        },
        onSaveSuccess() {
            this.showNotification(
                this.$t('success'),
                this.$t('salarySaved'),
                false
            );
            this.clearForm();
        },
        onDeleteSuccess() {
            this.showNotification(
                this.$t('success'),
                this.$t('salaryDeleted'),
                false
            );
            this.clearForm();
        },
        onEditingItemChanged(item) {
            const iso = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');
            this.form.start_date = iso(item.startDate);
            this.form.end_date = iso(item.endDate);
            this.form.amount = item.amount ?? 0;
            this.form.currency_id = item.currencyId ?? null;
            this.form.payment_type = Boolean(item.paymentType);
            this.form.note = item.note ?? '';
        },
    }
};
</script>
