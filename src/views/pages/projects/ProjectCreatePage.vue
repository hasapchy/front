<template>
    <h2 class="text-lg font-bold mb-4">Проект</h2>
    <div>
        <label>Название</label>
        <input type="text" v-model="name">
    </div>
    <div>
        <label>Бюджет проекта</label>
        <input type="number" v-model="budget">
    </div>
    <div>
        <label>Дата проекта</label>
        <input type="date" v-model="date">
    </div>
    <!-- Начало блока поиска клиентов -->

    <div v-if="selectedClient == null" class="mb-4">
        <label class="block mb-1">Поиск клиента</label>
        <input type="text" v-model="clientSearch" placeholder="Введите имя или номер клиента"
            class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="showDropdown = false">
        <transition name="appear">
            <ul v-show="showDropdown"
                class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                <li v-if="clientSearch.length === 0" class="p-2 text-gray-500">Введите запрос</li>
                <li v-else-if="clientSearch.length < 4" class="p-2 text-gray-500">Минимум 4 символа</li>
                <li v-else-if="clientResults.length === 0" class="p-2 text-gray-500">Не найдено</li>
                <li v-for="client in clientResults" :key="client.id" @mousedown.prevent="() => { selectClient(client) }"
                    class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                    <div class="flex justify-between">
                        <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                        <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                    </div>
                    <!-- <span :class="client.balance > 0 ? 'text-green-500' : 'text-red-500'">
                    {{ client.convertedBalance.toFixed(2) }} {{ client.currencySymbol }}
                    <span v-if="client.balance > 0">(Клиент должен нам)</span>
                    <span v-else-if="client.balance < 0">(Мы должны клиенту)</span>
                    <span v-else>(0)</span>
                </span> -->
                </li>
            </ul>
        </transition>
    </div>
    <div v-else class="mb-4">
        <div class="p-2 pt-0 mt-2 border-2 border-gray-400/60 rounded-md">
            <div class="flex justify-between items-center">
                <div>
                    <label>Клиент</label>
                    <p><span class="font-semibold text-sm">Имя:</span> {{ selectedClient.fullName() }}</p>
                    <p><span class="font-semibold text-sm">Номер:</span> {{ selectedClient.phones[0].phone }}</p>
                    <!-- <p><strong>Баланс:</strong>
                        <span
                        class="{{ optional($selectedClient->balance)->balance > 0 ? 'text-green-500' : 'text-red-500' }}">
                        {{ number_format((optional($selectedClient->balance)->balance ?? 0) * $conversionRate, 2) }}
                        {{ $conversionService->getSelectedCurrency($sessionCurrencyCode)->symbol }}
                        @if (optional($selectedClient->balance)->balance > 0)
                                (Клиент должен нам)
                            @elseif(optional($selectedClient->balance)->balance < 0)
                            (Мы должны клиенту)
                            @else
                            (0)
                            @endif
                        </span>
                    </p> -->
                </div>
                <button v-on:click="deselectClient" class="text-red-500 text-2xl cursor-pointer">&times;</button>
            </div>
        </div>
    </div>

    <!-- Конец блока поиска клиентов -->
    <div class="mt-4">
        <label>Назначить пользователей</label>
        <div v-if="users != null && users.length != 0" class="flex flex-wrap gap-2">
            <label v-for="user, index in users" :key="user.id"
                class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                <input type="checkbox" :value="user.id" v-model="selectedUsers" :id="'user-' + user.id">
                <span class="text-black">{{ user.name }}</span>
            </label>
        </div>
    </div>
    <!-- {{ editingItem.id }} -->
    <div class="mt-4 flex space-x-2">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление категории'" :confirm-text="'Удалить категорию'" :leave-text="'Отмена'" />
</template>


<script>
import UsersController from '@/api/UsersController';
import ClientController from '@/api/ClientController';
import ProjectDto from '@/dto/project/ProjectDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import debounce from 'lodash.debounce';
import ProjectController from '@/api/ProjectController';


export default {
    components: {
        PrimaryButton,
        AlertDialog
    },
    props: {
        editingItem: {
            type: ProjectDto,
            required: false,
            default: null
        }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            budget: this.editingItem ? this.editingItem.budget : 0,
            date: this.editingItem ? this.editingItem.date : '',
            selectedUsers: this.editingItem ? this.editingItem.users.map(user => user.id.toString()) : [],
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            users: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            // Поиск клиентов
            clientSearch: '',
            clientResults: [],
            showDropdown: false
        }
    },
    created() {
        this.fetchUsers();
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        async fetchUsers() {
            this.users = await UsersController.getAllUsers();
        },
        // Поиск клиентов
        searchClients: debounce(async function () {
            if (this.clientSearch.length >= 4) {
                console.log('searching clients');
                const results = await ClientController.search(this.clientSearch);
                this.clientResults = results;
            } else {
                this.clientResults = [];
            }
        }, 250),
        selectClient(client) {
            this.showDropdown = false;
            this.clientSearch = '';
            this.clientResults = [];
            this.selectedClient = client;
            console.log('Selected client:', client);
        },
        deselectClient() {
            this.selectedClient = null;
        },
        async save() {
            this.saveLoading = true;
            try {
                if (this.editingItemId != null) {
                    var resp = await ProjectController.updateItem(
                        this.editingItemId,
                        {
                            name: this.name,
                            budget: this.budget,
                            date: this.date,
                            client_id: this.selectedClient.id,
                            users: this.selectedUsers,
                        });
                } else {
                    var resp = await ProjectController.storeItem({
                        name: this.name,
                        date: this.date,
                        budget: this.budget,
                        client_id: this.selectedClient.id,
                        users: this.selectedUsers
                    });
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
            // this.closeDeleteDialog();
            // if (this.editingItemId == null) {
            //     return;
            // }
            // this.deleteLoading = true;
            // try {
            //     var resp = await CategoryController.deleteItem(
            //         this.editingItemId);
            //     if (resp.message) {
            //         this.$emit('deleted');
            //         this.clearForm();
            //     }
            // } catch (error) {
            //     this.$emit('deleted-error', error);
            // }
            // this.deleteLoading = false;
        },
        clearForm() {
            this.name = '';
            this.date = '';
            this.budget = 0;
            this.selectedClient = null;
            this.selectedUsers = [];
            this.editingItemId = null;
            this.fetchUsers();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        }

    },
    watch: {
        // Поиск клиентов
        clientSearch: {
            handler: 'searchClients',
            immediate: true
        },
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name || '';
                    this.budget = newEditingItem.budget || 0;
                    this.date = newEditingItem.date || '';
                    this.selectedClient = newEditingItem.client || null;
                    this.selectedUsers = Array.isArray(newEditingItem.users)
                        ? newEditingItem.users
                        : [];
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.date = '';
                    this.budget = 0;
                    this.selectedClient = null;
                    this.selectedUsers = [];
                    this.editingItemId = null;
                }
            },
            deep: true,
            immediate: true
        }
    }
}

</script>

<!-- Стили для поиска клиентов: -->
<style scoped>
.appear-enter-active,
.appear-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
    transform: scaleY(0);
    opacity: 0;
    transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
    transform: scaleY(1);
    opacity: 1;
    transform-origin: top;
}
</style>