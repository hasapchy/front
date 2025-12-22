<template>
    <div class="relative">
        <label v-if="showLabel" :class="['block', 'mb-1', { 'required': required }]">{{ label || $t('user') || 'Сотрудник' }}</label>
        
        <div v-if="!multiple">
            <div v-if="selectedUser == null" class="relative">
                <input type="text" v-model="userSearch" :placeholder="$t('enterUserNameOrPosition')"
                    class="w-full p-2 border rounded" @focus="handleFocus" @blur="handleBlur" :disabled="disabled" />
                <transition name="appear">
                    <ul v-show="showDropdown"
                        class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1 z-10">
                        <li v-if="userSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                        <template v-else-if="userSearch.length === 0">
                            <li v-for="user in lastUsers" :key="user.id" @mousedown.prevent="selectUser(user)"
                                class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <img v-if="getUserPhoto(user)" :src="getUserPhoto(user)" :alt="getUserFullName(user)" class="w-full h-full object-cover">
                                        <i v-else class="fas fa-user text-gray-500"></i>
                                    </div>
                                    <div>{{ getUserFullName(user) }}</div>
                                </div>
                            </li>
                        </template>
                        <li v-else-if="userSearch.length < 3" class="p-2 text-gray-500">{{ $t('minimum3Characters') }}</li>
                        <li v-else-if="userResults.length === 0" class="p-2 text-gray-500">{{ $t('notFound') }}</li>
                        <li v-for="user in userResults" :key="user.id" @mousedown.prevent="() => selectUser(user)"
                            class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                                    <img v-if="getUserPhoto(user)" :src="getUserPhoto(user)" :alt="getUserFullName(user)" class="w-full h-full object-cover">
                                    <i v-else class="fas fa-user text-gray-500"></i>
                                </div>
                                <div>{{ getUserFullName(user) }}</div>
                            </div>
                        </li>
                    </ul>
                </transition>
            </div>
            <div v-else class="mt-2">
                <div class="p-2 pt-0 border-2 border-gray-400/60 rounded-md">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <img v-if="selectedUserPhoto" :src="selectedUserPhoto" :alt="userFullName" class="w-full h-full object-cover">
                                <i v-else class="fas fa-user text-gray-500"></i>
                            </div>
                            <div>
                                <label :class="{ 'required': required }">{{ label || $t('user') || 'Сотрудник' }}</label>
                                <p><span class="text-xs">{{ $t('name') }}:</span> <span class="font-semibold text-sm">{{ userFullName }}</span></p>
                                <p v-if="userPosition"><span class="text-xs">{{ $t('position') || 'Должность' }}:</span> <span class="font-semibold text-sm">{{ userPosition }}</span></p>
                            </div>
                        </div>
                        <button v-if="allowDeselect" v-on:click="deselectUser" class="text-red-500 text-2xl cursor-pointer" :disabled="disabled">×</button>
                    </div>
                </div>
            </div>
        </div>

        <div v-else>
            <div class="relative">
                <div class="w-full p-2 border rounded flex flex-wrap items-center gap-1.5 cursor-text relative" style="min-height: 40px;" @click="focusInput">
                    <div v-for="user in selectedUsersObjects" :key="user.id" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs flex-shrink-0">
                        <div class="w-4 h-4 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <img v-if="getUserPhoto(user)" :src="getUserPhoto(user)" :alt="getUserFullName(user)" class="w-full h-full object-cover">
                            <i v-else class="fas fa-user text-gray-500 text-[10px]"></i>
                        </div>
                        <span class="text-xs whitespace-nowrap">{{ getUserFullName(user) }}</span>
                        <button v-if="allowDeselect" @mousedown.prevent="removeUser(user)" class="text-red-500 hover:text-red-700 ml-0.5 text-sm leading-none flex-shrink-0" :disabled="disabled">×</button>
                    </div>
                    <input 
                        ref="searchInput"
                        type="text" 
                        v-model="userSearch" 
                        :placeholder="selectedUsersObjects.length === 0 ? $t('enterUserNameOrPosition') : ''"
                        class="outline-none border-none bg-transparent p-0 m-0"
                        :class="selectedUsersObjects.length === 0 ? 'flex-1 min-w-[120px]' : ''"
                        :style="selectedUsersObjects.length > 0 && !userSearch ? { width: '2px', minWidth: '2px', padding: 0, opacity: 0 } : selectedUsersObjects.length > 0 ? { minWidth: '120px', flex: '1 1 auto' } : {}"
                        @focus="handleFocus" 
                        @blur="handleBlur"
                        @input="handleInput"
                        :disabled="disabled" 
                    />
                </div>
                <transition name="appear">
                    <ul v-show="showDropdown"
                        class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1 z-10">
                        <li v-if="userSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                        <template v-else-if="userSearch.length === 0">
                            <li v-for="user in lastUsers" :key="user.id" @mousedown.prevent="toggleUser(user)"
                                :class="['cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100', { 'bg-blue-50': isUserSelected(user) }]">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <img v-if="getUserPhoto(user)" :src="getUserPhoto(user)" :alt="getUserFullName(user)" class="w-full h-full object-cover">
                                        <i v-else class="fas fa-user text-gray-500"></i>
                                    </div>
                                    <div>{{ getUserFullName(user) }}</div>
                                </div>
                            </li>
                        </template>
                        <li v-else-if="userSearch.length < 3" class="p-2 text-gray-500">{{ $t('minimum3Characters') }}</li>
                        <li v-else-if="userResults.length === 0" class="p-2 text-gray-500">{{ $t('notFound') }}</li>
                        <li v-for="user in userResults" :key="user.id" @mousedown.prevent="toggleUser(user)"
                            :class="['cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100', { 'bg-blue-50': isUserSelected(user) }]">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                                    <img v-if="getUserPhoto(user)" :src="getUserPhoto(user)" :alt="getUserFullName(user)" class="w-full h-full object-cover">
                                    <i v-else class="fas fa-user text-gray-500"></i>
                                </div>
                                <div>{{ getUserFullName(user) }}</div>
                            </div>
                        </li>
                    </ul>
                </transition>
            </div>
        </div>
    </div>
</template>

<script>
import UsersController from '@/api/UsersController';
import debounce from 'lodash.debounce';

export default {
    name: 'UserSearch',
    props: {
        selectedUser: {
            type: [Object, Number],
            default: null,
        },
        selectedUsers: {
            type: Array,
            default: () => [],
        },
        multiple: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        required: {
            type: Boolean,
            default: false,
        },
        showLabel: {
            type: Boolean,
            default: true,
        },
        allowDeselect: {
            type: Boolean,
            default: true,
        },
        label: {
            type: String,
            default: '',
        },
        filterUsers: {
            type: Function,
            default: null,
        },
    },
    data() {
        return {
            userSearch: '',
            userSearchLoading: false,
            userResults: [],
            lastUsers: [],
            showDropdown: false,
            selectedUsersCache: [],
        };
    },
    computed: {
        userFullName() {
            if (!this.selectedUser) return '';
            if (typeof this.selectedUser.fullName === 'function') {
                return this.selectedUser.fullName();
            }
            const user = this.selectedUser;
            const name = user.name || '';
            const surname = user.surname || '';
            const position = user.position || '';
            const fullName = [name, surname].filter(Boolean).join(' ').trim();
            if (position) {
                return `${fullName} (${position})`;
            }
            return fullName;
        },
        userPosition() {
            if (!this.selectedUser) return '';
            return this.selectedUser.position || '';
        },
        selectedUserPhoto() {
            if (!this.selectedUser) return null;
            if (typeof this.selectedUser.photoUrl === 'function') {
                return this.selectedUser.photoUrl();
            }
            if (this.selectedUser.photo) {
                return `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.selectedUser.photo}`;
            }
            return null;
        },
        selectedUsersObjects() {
            if (!this.multiple || !Array.isArray(this.selectedUsers) || this.selectedUsers.length === 0) {
                return [];
            }
            const userIds = this.selectedUsers.map(id => Number(id));
            return this.selectedUsersCache.filter(u => userIds.includes(Number(u.id)));
        },
    },
    async created() {
        await this.fetchLastUsers();

        if (this.multiple && Array.isArray(this.selectedUsers) && this.selectedUsers.length > 0) {
            await this.loadSelectedUsers();
        } else if (this.selectedUser && this.selectedUser.id) {
            try {
                if (typeof this.selectedUser.fullName === 'function') {
                    return;
                }
                const updatedUser = await UsersController.getItem(this.selectedUser.id);
                this.$emit('update:selectedUser', updatedUser);
            } catch (error) {
                console.error('Ошибка при обновлении данных пользователя:', error);
            }
        }
    },
    emits: ['update:selectedUser', 'update:selectedUsers'],
    methods: {
        async fetchLastUsers() {
            try {
                let allUsers = this.$store.getters.usersForCurrentCompany;
                
                if (!allUsers || allUsers.length === 0) {
                    await this.$store.dispatch('loadUsers');
                    allUsers = this.$store.getters.usersForCurrentCompany;
                }

                this.updateLastUsersFromStore(allUsers);
            } catch (error) {
                console.error('Ошибка при загрузке последних пользователей:', error);
                this.lastUsers = [];
            }
        },
        updateLastUsersFromStore(allUsers = null) {
            const users = allUsers || this.$store.getters.usersForCurrentCompany;
            
            if (users && users.length > 0) {
                let filteredUsers = users.filter((user) => user.isActive !== false);
                
                if (this.multiple && this.filterUsers) {
                    filteredUsers = filteredUsers.filter(this.filterUsers);
                }
                
                this.lastUsers = filteredUsers
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                    .slice(0, 10);
            } else {
                this.lastUsers = [];
            }
        },
        async loadSelectedUsers() {
            if (!this.multiple || !Array.isArray(this.selectedUsers) || this.selectedUsers.length === 0) {
                this.selectedUsersCache = [];
                return;
            }

            try {
                if (!this.$store) {
                    console.error('Store не доступен');
                    return;
                }

                let allUsers = this.$store.getters?.usersForCurrentCompany || [];
                
                if (!allUsers || allUsers.length === 0) {
                    if (this.$store.dispatch) {
                        await this.$store.dispatch('loadUsers');
                        allUsers = this.$store.getters?.usersForCurrentCompany || [];
                    }
                }
                
                const userIds = this.selectedUsers.map(id => Number(id));
                this.selectedUsersCache = allUsers.filter(u => userIds.includes(Number(u.id)));
                
                const missingIds = userIds.filter(id => !this.selectedUsersCache.find(u => Number(u.id) === id));
                if (missingIds.length > 0) {
                    for (const id of missingIds) {
                        try {
                            const user = await UsersController.getItem(id);
                            if (user) {
                                this.selectedUsersCache.push(user);
                            }
                        } catch (error) {
                            console.error(`Ошибка при загрузке пользователя ${id}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка при загрузке выбранных пользователей:', error);
            }
        },
        searchUsers: debounce(async function () {
            if (this.userSearch.length >= 3) {
                this.userSearchLoading = true;
                try {
                    let results = await UsersController.searchItems(this.userSearch);
                    
                    if (this.multiple && this.filterUsers) {
                        results = results.filter(this.filterUsers);
                    }
                    
                    this.userResults = results;
                } catch (error) {
                    console.error('Ошибка при поиске пользователей:', error);
                    this.userResults = [];
                } finally {
                    this.userSearchLoading = false;
                }
            } else {
                this.userResults = [];
            }
        }, 250),
        async selectUser(user) {
            this.showDropdown = false;
            this.userSearch = '';
            this.userResults = [];
            this.$emit('update:selectedUser', user);
        },
        toggleUser(user) {
            if (this.disabled) return;
            
            const userId = Number(user.id);
            const currentIds = Array.isArray(this.selectedUsers) ? this.selectedUsers.map(id => Number(id)) : [];
            const isSelected = currentIds.includes(userId);
            
            let newIds;
            if (isSelected) {
                newIds = currentIds.filter(id => id !== userId);
            } else {
                newIds = [...currentIds, userId];
            }
            
            this.$emit('update:selectedUsers', newIds);
            
            if (!isSelected && !this.selectedUsersCache.find(u => Number(u.id) === userId)) {
                this.selectedUsersCache.push(user);
            }
        },
        removeUser(user) {
            if (this.disabled) return;
            
            const userId = Number(user.id);
            const currentIds = Array.isArray(this.selectedUsers) ? this.selectedUsers.map(id => Number(id)) : [];
            const newIds = currentIds.filter(id => id !== userId);
            
            this.$emit('update:selectedUsers', newIds);
            this.selectedUsersCache = this.selectedUsersCache.filter(u => Number(u.id) !== userId);
        },
        deselectUser() {
            this.$emit('update:selectedUser', null);
        },
        focusInput() {
            if (this.$refs.searchInput) {
                this.$refs.searchInput.focus();
            }
        },
        handleInput() {
            if (this.$refs.searchInput && this.selectedUsersObjects.length > 0) {
                const input = this.$refs.searchInput;
                if (this.userSearch) {
                    input.style.width = 'auto';
                    input.style.minWidth = '120px';
                    input.style.opacity = '1';
                } else {
                    input.style.width = '2px';
                    input.style.minWidth = '2px';
                    input.style.opacity = '0';
                }
            }
        },
        async handleFocus() {
            this.showDropdown = true;
            if (this.lastUsers.length === 0) {
                await this.fetchLastUsers();
            }
        },
        handleBlur() {
            requestAnimationFrame(() => {
                this.showDropdown = false;
            });
        },
        getUserPhoto(user) {
            if (!user) return null;
            if (typeof user.photoUrl === 'function') {
                return user.photoUrl();
            }
            if (user.photo) {
                return `${import.meta.env.VITE_APP_BASE_URL}/storage/${user.photo}`;
            }
            return null;
        },
        getUserFullName(user) {
            if (!user) return '';
            if (typeof user.fullName === 'function') {
                return user.fullName();
            }
            const name = user.name || '';
            const surname = user.surname || '';
            const position = user.position || '';
            const fullName = [name, surname].filter(Boolean).join(' ').trim();
            if (position) {
                return `${fullName} (${position})`;
            }
            return fullName;
        },
        isUserSelected(user) {
            if (!this.multiple || !user || !user.id) return false;
            const userId = Number(user.id);
            const currentIds = Array.isArray(this.selectedUsers) ? this.selectedUsers.map(id => Number(id)) : [];
            return currentIds.includes(userId);
        },
    },
    watch: {
        selectedUser: {
            handler(newVal) {
            },
            deep: true,
        },
        selectedUsers: {
            handler(newVal) {
                if (this.multiple) {
                    this.loadSelectedUsers();
                }
            },
            deep: true,
            immediate: true,
        },
        userSearch: {
            handler: 'searchUsers',
            immediate: true,
        },
        '$store.state.users': {
            handler(newUsers) {
                if (newUsers && newUsers.length > 0) {
                    this.updateLastUsersFromStore(newUsers);
                    if (this.multiple) {
                        this.loadSelectedUsers();
                    } else if (this.selectedUser?.id) {
                        const updated = newUsers.find(u => u.id === this.selectedUser.id);
                        if (updated) {
                            this.$emit('update:selectedUser', updated);
                        }
                    }
                }
            },
            immediate: true,
            deep: true,
        },
    },
};
</script>

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
