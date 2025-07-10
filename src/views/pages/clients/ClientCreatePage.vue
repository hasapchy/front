<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Клиент</h2>
        <TabBar :tabs="tabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
        <div>
            <div v-if="currentTab === 'info'" class="mb-4">
                <div>
                    <label class="required">Тип клиента</label>
                    <select v-model="clientType">
                        <option value="individual">Индивидуальный</option>
                        <option value="company">Компания</option>
                    </select>
                </div>
                <div>
                    <label class="required">Имя</label>
                    <input type="text" v-model="firstName" required>
                </div>
                <div v-if="clientType === 'individual'">
                    <label>Фамилия</label>
                    <input type="text" v-model="lastName">
                </div>
                <div v-else>
                    <label>Контактное лицо</label>
                    <input type="text" v-model="contactPerson">
                </div>
                <div>
                    <label>Адрес</label>
                    <input type="text" v-model="address">
                </div>
                <div>
                    <label>Заметка</label>
                    <input type="text" v-model="note" />
                </div>
                <label>Характеристики</label>
                <div class="flex flex-wrap gap-2">
                    <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                        <input type="checkbox" v-model="status">
                        <span>Активен</span>
                    </label>
                    <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                        <input type="checkbox" v-model="isSupplier">
                        <span>Поставщик</span>
                    </label>
                    <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                        <input type="checkbox" v-model="isConflict">
                        <span>Проблемный клиент</span>
                    </label>
                </div>
                <div>
                    <label class="required">Номер телефона</label>
                    <div class="flex items-center space-x-2">
                        <input type="text" v-model="newPhone" ref="phoneInput" @keyup.enter="addPhone" required>
                        <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="addPhone" />
                    </div>
                    <div v-for="(phone, index) in phones" :key="phone" class="flex items-center space-x-2 mt-2">
                        <input type="text" :value="phone" readonly>
                        <PrimaryButton icon="fas fa-close" :is-danger="true" :onclick="() => removePhone(index)" />
                    </div>
                </div>
                <div>
                    <label>Email</label>
                    <div class="flex items-center space-x-2">
                        <input type="text" v-model="newEmail" @keyup.enter="addEmail">
                        <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="addEmail" />
                    </div>
                    <div v-for="(email, index) in emails" :key="email" class="flex items-center space-x-2 mt-2">
                        <input type="text" :value="email" readonly>
                        <PrimaryButton icon="fas fa-close" :is-danger="true" :onclick="() => removeEmail(index)" />
                    </div>
                </div>
                <div class="flex gap-4 w-full">
                    <div class="flex flex-col w-full">
                        <label>Тип скидки</label>
                        <select v-model="discountType" class="w-full">
                            <option value="">Выберите тип скидки</option>
                            <option value="percent">Процентная</option>
                            <option value="fixed">Фиксированная</option>
                        </select>
                    </div>
                    <div class="flex flex-col w-full">
                        <label>Скидка</label>
                        <input type="number" v-model="discount" class="w-full" />
                    </div>
                </div>
            </div>
        </div>
        <div v-show="currentTab === 'balance'" class="mt-4">
            <h3 class="text-md font-semibold mb-2">История баланса</h3>
            <div v-if="balanceLoading" class="text-gray-500">Загрузка...</div>
            <div v-else-if="balanceHistory.length === 0" class="text-gray-500">История отсутствует</div>
            <DraggableTable v-if="!balanceLoading && balanceHistory.length" table-key="client.balance"
                :columns-config="columnsBalance" :table-data="balanceHistory" :item-mapper="itemMapperBalance"
                :onItemClick="handleBalanceItemClick" />
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление клиента'" :confirm-text="'Удалить клиента'" :leave-text="'Отмена'" />
    <SideModalDialog :showForm="entityModalOpen" :onclose="() => { entityModalOpen = false; selectedEntity = null }">
        <template v-if="selectedEntity">
            <TransactionCreatePage v-if="selectedEntity.type === 'transaction'" :editing-item="selectedEntity.data" />
            <SaleCreatePage v-else-if="selectedEntity.type === 'sale'" :editing-item-id="selectedEntity.id" />
            <OrderCreatePage v-else-if="selectedEntity.type === 'order'" :editing-item-id="selectedEntity.id" />
            <WarehousesReceiptCreatePage v-else-if="selectedEntity.type === 'receipt'"
                :editing-item-id="selectedEntity.id" />
        </template>
    </SideModalDialog>
</template>

<script>
import ClientController from '@/api/ClientController';
import ClientDto from '@/dto/client/ClientDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import Inputmask from 'inputmask';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TransactionController from '@/api/TransactionController';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import SaleCreatePage from '@/views/pages/sales/SaleCreatePage.vue';

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        TabBar,
        DraggableTable,
        SideModalDialog,
        TransactionCreatePage,
        SaleCreatePage,

    },
    props: {
        editingItem: { type: ClientDto, default: null },
        defaultFirstName: { type: String, default: '' }
    },
    data() {
        return {
            firstName: this.editingItem ? this.editingItem.firstName : this.defaultFirstName || '',
            lastName: this.editingItem ? this.editingItem.lastName : '',
            contactPerson: this.editingItem ? this.editingItem.contactPerson : '',
            clientType: this.editingItem ? this.editingItem.clientType : 'individual',
            address: this.editingItem ? this.editingItem.address : '',
            note: this.editingItem ? this.editingItem.note : '',
            status: this.editingItem ? this.editingItem.status : true,
            isConflict: this.editingItem ? this.editingItem.isConflict : false,
            isSupplier: this.editingItem ? this.editingItem.isSupplier : false,
            phones: this.editingItem ? this.editingItem.phones.map(phone => phone.phone) : [],
            emails: this.editingItem ? this.editingItem.emails.map(email => email.email) : [],
            discountType: this.editingItem ? this.editingItem.discountType : 'fixed',
            discount: this.editingItem ? this.editingItem.discount : 0,
            newPhone: '',
            newEmail: '',
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            balanceLoading: false,
            balanceHistory: [],
            selectedEntity: null,
            entityModalOpen: false,

            ///
            currentTab: 'info',
            tabs: [
                {
                    name: 'info',
                    label: 'Информация'
                },
                {
                    name: 'balance',
                    label: 'Баланс'
                }
            ],
            columnsBalance: [
                { name: 'date', label: 'Дата', size: 100 },
                { name: 'type', label: 'Тип' },
                { name: 'description', label: 'Описание', size: 300 },
                { name: 'amount', label: 'Сумма', size: 120, html: true },
            ],
        }
    },
    mounted() {
        const phoneInput = this.$refs.phoneInput;
        const mask = new Inputmask({
            mask: "\\9\\9\\3 99 999999",
            placeholder: "_",
            showMaskOnHover: false,
            showMaskOnFocus: true,
            clearIncomplete: true,
            keepStatic: true
        });
        mask.mask(phoneInput);
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        addPhone() {
            if (this.newPhone) {
                const cleanedPhone = this.newPhone.replace(/[\s-()]/g, '');
                if (this.phones.includes(cleanedPhone)) {
                    alert('Этот номер телефона уже добавлен!');
                    return;
                }
                this.phones.push(cleanedPhone);
                this.newPhone = '';
            }
        },
        getModalProps(entity) {
            if (entity.type === 'transaction') {
                return {
                    editingItem: entity.data,
                };
            }
            return {
                editingItemId: entity.id,
            };
        },
        getModalComponent(type) {
            switch (type) {
                case 'sale':
                    return () => import('@/views/pages/sales/SaleCreatePage.vue');
                case 'order':
                    return () => import('@/views/pages/orders/OrderCreatePage.vue');
                case 'transaction':
                    return () => import('@/views/pages/transactions/TransactionCreatePage.vue');
                case 'receipt':
                    return () => import('@/views/pages/warehouses/WarehousesReceiptCreatePage.vue');
                default:
                    return null;
            }
        },
        async handleBalanceItemClick(item) {
            console.log('[click] Клик по строке баланса', item);

            switch (item.source) {
                case 'transaction':
                    try {
                        const resp = await TransactionController.getItem(item.sourceId);
                        console.log('RESP', resp);
                        this.selectedEntity = {
                            type: 'transaction',
                            data: resp.item,
                        };
                        this.entityModalOpen = true;
                    } catch (e) {
                        console.error('Ошибка при загрузке транзакции:', e);
                    }

                    break;

                case 'sale':
                case 'order':
                case 'receipt':
                    this.selectedEntity = {
                        type: item.source,
                        id: item.sourceId
                    };
                    this.entityModalOpen = true;
                    break;

                default:
                    this.selectedEntity = null;

            }

        },

        removePhone(index) {
            this.phones.splice(index, 1);
        },
        addEmail() {
            if (this.newEmail) {
                this.emails.push(this.newEmail);
                this.newEmail = '';
            }
        },
        removeEmail(index) {
            this.emails.splice(index, 1);
        },
        itemMapperBalance(i, c) {
            switch (c) {
                case 'date':
                    return i.formatDate();
                case 'type':
                    return i.label?.() ?? item.type;
                case 'description':
                    return i.description;
                case 'amount':
                    return i.formatAmountWithColor?.();
                default:
                    return i[c];
            }
        },
        async save() {
            this.saveLoading = true;
            try {
                const clientData = {
                    first_name: this.firstName,
                    last_name: this.lastName,
                    contact_person: this.contactPerson,
                    client_type: this.clientType,
                    address: this.address,
                    note: this.note,
                    status: this.status,
                    is_conflict: this.isConflict,
                    is_supplier: this.isSupplier,
                    phones: this.phones,
                    emails: this.emails,
                    discount_type: this.discountType,
                    discount: this.discount
                };

                let resp;
                if (this.editingItem) {
                    resp = await ClientController.updateItem(this.editingItem.id, clientData);
                } else {
                    resp = await ClientController.storeItem(clientData);
                }

                if (resp.message) {
                    this.$emit('saved', resp.item || clientData);
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;
        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItem) {
                return;
            }
            this.deleteLoading = true;
            try {
                const resp = await ClientController.deleteItem(this.editingItem.id);
                if (resp.message) {
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.firstName = '';
            this.lastName = '';
            this.contactPerson = '';
            this.clientType = 'individual';
            this.address = '';
            this.note = '';
            this.status = true;
            this.isConflict = false;
            this.isSupplier = false;
            this.phones = [];
            this.emails = [];
            this.discountType = 'fixed';
            this.discount = 0;
            this.currentTab = 'info';
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        ///
        async fetchBalanceHistory() {
            if (!this.editingItem) return;
            this.balanceLoading = true;
            try {
                this.balanceHistory = await ClientController.getBalanceHistory(this.editingItem.id);
            } catch (e) {
                console.error('Ошибка при загрузке истории баланса:', e);
                this.balanceHistory = [];
            }
            this.balanceLoading = false;
        },
        changeTab(tab) {
            this.currentTab = tab;
            if (tab === 'balance') {
                this.fetchBalanceHistory();
            }
        },
       getApiErrorMessages(e) {
    if (e?.response && e.response.data) {
        if (e.response.data.errors) {
            return Object.values(e.response.data.errors).flat();
        }
        if (e.response.data.message) {
            return [e.response.data.message];
        }
    }
    if (e?.message) return [e.message];
    return ["Ошибка"];
}

    },
    watch: {
        defaultFirstName(newVal) {
            if (!this.editingItem) {
                this.firstName = newVal || '';
            }
        },
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.firstName = newEditingItem.firstName || '';
                    this.lastName = newEditingItem.lastName || '';
                    this.contactPerson = newEditingItem.contactPerson || '';
                    this.clientType = newEditingItem.clientType || 'individual';
                    this.address = newEditingItem.address || '';
                    this.note = newEditingItem.note || '';
                    this.status = newEditingItem.status || false;
                    this.isConflict = newEditingItem.isConflict || false;
                    this.isSupplier = newEditingItem.isSupplier || false;
                    this.phones = newEditingItem.phones.map(phone => phone.phone) || [];
                    this.emails = newEditingItem.emails.map(email => email.email) || [];
                    this.discountType = newEditingItem.discountType ?? 'fixed';
                    this.discount = newEditingItem.discount ?? 0;
                    this.currentTab = 'info';
                } else {
                    this.clearForm();
                }
            },
            deep: true,
            immediate: true
        },
        clientType: {
            handler(type) {
                if (type === 'individual') {
                    this.contactPerson = '';
                } else {
                    this.lastName = '';
                }
            },
            deep: true,
            immediate: true
        },
    }
}
</script>
