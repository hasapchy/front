<template>
  <div class="relative">
    <label
      v-if="showLabel"
      :class="['block', 'mb-1', { 'required': required }]"
    >{{ label || $t('user') }}</label>

    <div v-if="!multiple">
      <div
        v-if="selectedUser == null"
        class="relative"
      >
        <input
          v-model="userSearch"
          type="text"
          :placeholder="$t('enterUserNameOrPosition')"
          class="w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] p-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          :disabled="disabled"
          @focus="handleFocus"
          @blur="handleBlur"
        >
        <transition name="appear">
          <ul
            v-show="showDropdown"
            class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border border-[var(--input-border)] bg-[var(--surface-elevated)] shadow-lg"
          >
            <li
              v-if="userSearchLoading"
              class="p-2 text-[var(--text-secondary)]"
            >
              {{ $t('loading') }}
            </li>
            <template v-else-if="userSearch.length === 0">
              <li
                v-for="user in lastUsers"
                :key="user.id"
                class="cursor-pointer border-b border-[var(--border-subtle)] p-2 text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                @mousedown.prevent="selectUser(user)"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)]"
                  >
                    <img
                      v-if="getUserPhoto(user)"
                      :src="getUserPhoto(user)"
                      :alt="getUserFullName(user)"
                      class="h-full w-full object-cover"
                      @error="applyAvatarImageFallback"
                    >
                    <i
                      v-else
                      class="fas fa-user text-[var(--text-secondary)]"
                    />
                  </div>
                  <div class="text-[var(--text-primary)]">
                    <div>{{ getUserDisplayName(user) }}</div>
                    <div
                      v-if="getUserPosition(user)"
                      class="text-xs text-[var(--text-secondary)]"
                    >
                      {{ getUserPosition(user) }}
                    </div>
                  </div>
                </div>
              </li>
            </template>
            <li
              v-else-if="userSearch.length < 3"
              class="p-2 text-[var(--text-secondary)]"
            >
              {{ $t('minimum3Characters') }}
            </li>
            <li
              v-else-if="userResults.length === 0"
              class="p-2 text-[var(--text-secondary)]"
            >
              {{ $t('notFound') }}
            </li>
            <li
              v-for="user in userResults"
              :key="user.id"
              class="cursor-pointer border-b border-[var(--border-subtle)] p-2 text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
              @mousedown.prevent="() => selectUser(user)"
            >
              <div class="flex items-center gap-2">
                <div
                  class="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)]"
                >
                  <img
                    v-if="getUserPhoto(user)"
                    :src="getUserPhoto(user)"
                    :alt="getUserFullName(user)"
                    class="h-full w-full object-cover"
                    @error="applyAvatarImageFallback"
                  >
                  <i
                    v-else
                    class="fas fa-user text-[var(--text-secondary)]"
                  />
                </div>
                <div class="text-[var(--text-primary)]">
                  <div>{{ getUserDisplayName(user) }}</div>
                  <div
                    v-if="getUserPosition(user)"
                    class="text-xs text-[var(--text-secondary)]"
                  >
                    {{ getUserPosition(user) }}
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </transition>
      </div>
      <div
        v-else
        class="mt-2"
      >
        <div class="rounded-md border-2 border-[var(--input-border)] p-2 pt-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)]"
              >
                <img
                  v-if="selectedUserPhoto"
                  :src="selectedUserPhoto"
                  :alt="userFullName"
                  class="h-full w-full object-cover"
                  @error="applyAvatarImageFallback"
                >
                <i
                  v-else
                  class="fas fa-user text-[var(--text-secondary)]"
                />
              </div>
              <div class="text-[var(--text-primary)]">
                <label :class="{ 'required': required }">{{ label || $t('user') }}</label>
                <p><span class="text-xs text-[var(--text-secondary)]">{{ $t('name') }}:</span> <span class="text-sm font-semibold">{{ userFullNameWithoutPosition }}</span></p>
                <p
                  v-if="userPosition"
                  class="text-xs text-[var(--text-secondary)]"
                >
                  {{ userPosition }}
                </p>
              </div>
            </div>
            <button
              v-if="allowDeselect"
              class="cursor-pointer text-2xl text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              :disabled="disabled"
              @click="deselectUser"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="relative">
        <div
          class="flex w-full min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-md border-2 border-[var(--input-border)] bg-[var(--input-bg)] p-2 transition-all duration-200 ease-in-out focus-within:border-[var(--label-accent)] focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--label-accent)_22%,transparent)]"
          @click="focusInput"
        >
          <div
            v-for="user in selectedUsersObjects"
            :key="user.id"
            class="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--label-accent)_28%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--label-accent)_12%,var(--surface-muted))] px-2 py-0.5 text-xs text-[var(--label-accent)]"
          >
            <div
              class="flex h-4 w-4 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-elevated)] ring-1 ring-[var(--border-subtle)]"
            >
              <img
                v-if="getUserPhoto(user)"
                :src="getUserPhoto(user)"
                :alt="getUserFullName(user)"
                class="h-full w-full object-cover"
                @error="applyAvatarImageFallback"
              >
              <i
                v-else
                class="fas fa-user text-[10px] text-[var(--text-secondary)]"
              />
            </div>
            <span class="whitespace-nowrap text-xs">
              <span>{{ getUserDisplayName(user) }}</span>
              <span
                v-if="getUserPosition(user)"
                class="block text-[10px] text-[var(--text-secondary)]"
              >{{ getUserPosition(user) }}</span>
            </span>
            <button
              v-if="allowDeselect"
              class="ml-0.5 flex-shrink-0 text-sm leading-none text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              :disabled="disabled"
              @mousedown.prevent="removeUser(user)"
            >
              ×
            </button>
          </div>
          <input
            ref="searchInput"
            v-model="userSearch"
            type="text"
            :placeholder="selectedUsersObjects.length === 0 ? $t('enterUserNameOrPosition') : ''"
            class="m-0 min-w-0 border-0 bg-transparent p-0 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-0 focus:ring-0 !shadow-none focus:!shadow-none"
            :class="selectedUsersObjects.length === 0 ? 'flex-1 min-w-[120px]' : ''"
            :style="selectedUsersObjects.length > 0 && !userSearch ? { width: '2px', minWidth: '2px', padding: 0, opacity: 0, border: 'none' } : selectedUsersObjects.length > 0 ? { minWidth: '120px', flex: '1 1 auto', border: 'none' } : { border: 'none' }"
            :disabled="disabled"
            @focus="handleFocus"
            @blur="handleBlur"
            @input="handleInput"
          >
        </div>
        <transition name="appear">
          <ul
            v-show="showDropdown"
            class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded border border-[var(--input-border)] bg-[var(--surface-elevated)] shadow-lg"
          >
            <li
              v-if="userSearchLoading"
              class="p-2 text-[var(--text-secondary)]"
            >
              {{ $t('loading') }}
            </li>
            <template v-else-if="userSearch.length === 0">
              <li
                v-for="user in lastUsers"
                :key="user.id"
                :class="[
                  'cursor-pointer border-b border-[var(--border-subtle)] p-2 text-[var(--text-primary)] hover:bg-[var(--surface-muted)]',
                  { 'bg-[color-mix(in_srgb,var(--label-accent)_10%,var(--surface-muted))]': isUserSelected(user) },
                ]"
                @mousedown.prevent="toggleUser(user)"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)]"
                  >
                    <img
                      v-if="getUserPhoto(user)"
                      :src="getUserPhoto(user)"
                      :alt="getUserFullName(user)"
                      class="h-full w-full object-cover"
                      @error="applyAvatarImageFallback"
                    >
                    <i
                      v-else
                      class="fas fa-user text-[var(--text-secondary)]"
                    />
                  </div>
                  <div class="text-[var(--text-primary)]">
                    <div>{{ getUserDisplayName(user) }}</div>
                    <div
                      v-if="getUserPosition(user)"
                      class="text-xs text-[var(--text-secondary)]"
                    >
                      {{ getUserPosition(user) }}
                    </div>
                  </div>
                </div>
              </li>
            </template>
            <li
              v-else-if="userSearch.length < 3"
              class="p-2 text-[var(--text-secondary)]"
            >
              {{ $t('minimum3Characters') }}
            </li>
            <li
              v-else-if="userResults.length === 0"
              class="p-2 text-[var(--text-secondary)]"
            >
              {{ $t('notFound') }}
            </li>
            <li
              v-for="user in userResults"
              :key="user.id"
              :class="[
                'cursor-pointer border-b border-[var(--border-subtle)] p-2 text-[var(--text-primary)] hover:bg-[var(--surface-muted)]',
                { 'bg-[color-mix(in_srgb,var(--label-accent)_10%,var(--surface-muted))]': isUserSelected(user) },
              ]"
              @mousedown.prevent="toggleUser(user)"
            >
              <div class="flex items-center gap-2">
                <div
                  class="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)]"
                >
                  <img
                    v-if="getUserPhoto(user)"
                    :src="getUserPhoto(user)"
                    :alt="getUserFullName(user)"
                    class="h-full w-full object-cover"
                    @error="applyAvatarImageFallback"
                  >
                  <i
                    v-else
                    class="fas fa-user text-[var(--text-secondary)]"
                  />
                </div>
                <div class="text-[var(--text-primary)]">
                  <div>{{ getUserDisplayName(user) }}</div>
                  <div
                    v-if="getUserPosition(user)"
                    class="text-xs text-[var(--text-secondary)]"
                  >
                    {{ getUserPosition(user) }}
                  </div>
                </div>
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
import { getUserDisplayName as displayUserName, getUserPosition as displayUserPosition } from '@/utils/displayUtils';
import { applyAvatarImageFallback } from '@/constants/imageFallback';

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
    emits: ['update:selectedUser', 'update:selectedUsers'],
    data() {
        return {
            userSearch: '',
            userSearchLoading: false,
            userResults: [],
            lastUsers: [],
            searchAbortController: null,
            showDropdown: false,
            selectedUsersCache: [],
        };
    },
    computed: {
        userFullName() {
            if (!this.selectedUser) return '';
            const name = displayUserName(this.selectedUser);
            const position = displayUserPosition(this.selectedUser);
            return position ? `${name} (${position})` : name;
        },
        userFullNameWithoutPosition() {
            return displayUserName(this.selectedUser);
        },
        userPosition() {
            return displayUserPosition(this.selectedUser);
        },
        selectedUserPhoto() {
            if (!this.selectedUser) return null;
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
        } else {
            const selectedUserId = Number(this.selectedUser?.id ?? this.selectedUser) || null;
            if (!selectedUserId) {
                return;
            }
            try {
                const hasBaseData = this.selectedUser &&
                    Boolean(this.selectedUser.name || this.selectedUser.surname || this.selectedUser.position);
                if (hasBaseData) {
                    return;
                }
                this.$emit('update:selectedUser', await UsersController.getItem(selectedUserId));
            } catch {
                void 0;
            }
        }
    },
    methods: {
        applyAvatarImageFallback,
        async fetchLastUsers() {
            try {
                let allUsers = this.$store.getters.usersForCurrentCompany;

                if (!allUsers || allUsers.length === 0) {
                    await this.$store.dispatch('loadUsers');
                    allUsers = this.$store.getters.usersForCurrentCompany;
                }

                this.updateLastUsersFromStore(allUsers);
            } catch {
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
                            const fetchedUser = await UsersController.getItem(id);
                            if (fetchedUser) {
                                this.selectedUsersCache.push(fetchedUser);
                            }
                        } catch {
                            void 0;
                        }
                    }
                }
            } catch {
                void 0;
            }
        },
        searchUsers: debounce(async function () {
            if (this.userSearch.length >= 3) {
                if (this.searchAbortController) {
                    this.searchAbortController.abort();
                }
                this.searchAbortController = new AbortController();
                const signal = this.searchAbortController.signal;
                this.userSearchLoading = true;
                try {
                    let results = await UsersController.searchItems(this.userSearch, signal);
                    if (signal.aborted) return;

                    if (this.multiple && this.filterUsers) {
                        results = results.filter(this.filterUsers);
                    }

                    this.userResults = results;
                } catch (error) {
                    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') return;
                    this.userResults = [];
                } finally {
                    if (!signal.aborted) this.userSearchLoading = false;
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

            if (!isSelected) {
                this.userSearch = '';
                this.userResults = [];
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
            if (user.photo) {
                return `${import.meta.env.VITE_APP_BASE_URL}/storage/${user.photo}`;
            }
            return null;
        },
        getUserFullName(user) {
            if (!user) return '';
            const name = displayUserName(user);
            const position = displayUserPosition(user);
            return position ? `${name} (${position})` : name;
        },
        getUserDisplayName(user) {
            return displayUserName(user);
        },
        getUserPosition(user) {
            return displayUserPosition(user);
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
            handler() {
            },
            deep: true,
        },
        selectedUsers: {
            handler() {
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
