<template>
    <h2 class="text-lg font-bold mb-4">Клиент</h2>
    <TabBar :tabs="tabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
    <div>
        <label>Тип клиента</label>
        <select v-model="clientType">
            <option value="individual">Индивидуальный</option>
            <option value="company">Компания</option>
        </select>
    </div>
    <div>
        <label>Имя</label>
        <input type="text" v-model="firstName">
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
        <label>Номер телефона</label>
        <div class="flex items-center space-x-2">
            <input type="text" v-model="newPhone" ref="phoneInput" @keyup.enter="addPhone">
            <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="addPhone" />
        </div>
        <div v-for="(phone, index) in phones" :key="phone" class="flex items-center space-x-2 mt-2">
            <input type="text" :value="phone" readonly>
            <PrimaryButton icon="fas fa-close" :is-danger="true" :onclick="() => removePhone(index)" />
        </div>
        <!-- <ul>
            <li v-for="(phone, index) in phones" :key="phone" class="bg-gray-100 p-2 rounded my-2">
                {{ phone }} <button @click="removePhone(index)">Удалить</button>
                </li>
            </ul> -->
    </div>
    <div>
        <label>Emails</label>
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
    <div class="mt-4 flex space-x-2">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление клиента'" :confirm-text="'Удалить клиента'" :leave-text="'Отмена'" />
</template>

<script>
import ClientController from '@/api/ClientController';
import ClientDto from '@/dto/client/ClientDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import Inputmask from 'inputmask';

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        TabBar
    },
    props: {
        editingItem: {
            type: ClientDto,
            required: false,
            default: null
        }
    },
    data() {
        return {
            firstName: this.editingItem ? this.editingItem.firstName : '',
            lastName: this.editingItem ? this.editingItem.lastName : '',
            contactPerson: this.editingItem ? this.editingItem.contactPerson : '',
            clientType: this.editingItem ? this.editingItem.clientType : 'individual',
            address: this.editingItem ? this.editingItem.address : '',
            note: this.editingItem ? this.editingItem.note : '',
            status: this.editingItem ? this.editingItem.status : false,
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
            ///
            currentTab: 'form',
            tabs: [
                {
                    name: 'form',
                    label: 'Форма'
                },
                {
                    name: 'balance',
                    label: 'Баланс'
                }
            ]
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
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', error);
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
                this.$emit('deleted-error', error);
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
            this.status = false;
            this.isConflict = false;
            this.isSupplier = false;
            this.phones = [];
            this.emails = [];
            this.discountType = 'fixed';
            this.discount = 0;
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        ///
        changeTab(tab) {
            this.currentTab = tab;
        }
    },
    watch: {
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