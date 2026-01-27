<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow transition-shadow duration-200">
        <div class="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
            <div class="flex items-center gap-2">
                <i class="fas fa-circle text-green-500 text-xs"></i>
                <h3 class="text-sm font-semibold text-gray-900">{{ $t('onlineNow') || 'Онлайн сейчас' }}</h3>
            </div>
            <button class="text-gray-400 hover:text-gray-600 transition-colors">
                <i class="fas fa-question-circle text-xs"></i>
            </button>
        </div>
        
        <div v-if="loading" class="flex justify-center py-4">
            <i class="fas fa-spinner fa-spin text-gray-400"></i>
        </div>
        
        <div v-else-if="onlineCount > 0" class="space-y-4">
            <!-- Круговой индикатор с количеством -->
            <div class="flex items-center gap-4">
                <div class="relative w-16 h-16 shrink-0">
                    <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <!-- Фоновый круг -->
                        <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="#e5e7eb"
                            stroke-width="3"
                        />
                        <!-- Заполненный круг (снизу вверх) -->
                        <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="#10b981"
                            stroke-width="3"
                            :stroke-dasharray="`${circumference} ${circumference}`"
                            :stroke-dashoffset="strokeDashoffset"
                            stroke-linecap="round"
                        />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-lg font-bold text-gray-900">{{ onlineCount }}</span>
                    </div>
                </div>
                
                <!-- Аватары онлайн пользователей -->
                <div class="flex-1 flex items-center gap-1.5 overflow-visible">
                    <div 
                        v-for="(user, index) in visibleUsers" 
                        :key="user.id"
                        class="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shrink-0 flex items-center justify-center relative cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10"
                        :style="{ marginLeft: index > 0 ? '-8px' : '0' }"
                        @mouseenter="showUserTooltip($event, user)"
                        @mouseleave="hideUserTooltip"
                    >
                        <div class="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                            <img 
                                v-if="user.photoUrl" 
                                :src="user.photoUrl" 
                                class="w-full h-full object-cover"
                                :alt="user.name"
                                @error="handleImageError"
                            />
                            <i v-else class="fas fa-user text-gray-400 text-xs"></i>
                        </div>
                        <!-- Зеленый индикатор онлайн -->
                        <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm"></span>
                    </div>
                    <div 
                        v-if="moreUsersCount > 0"
                        class="w-8 h-8 rounded-full bg-[#337AB7] border-2 border-white shrink-0 flex items-center justify-center text-[10px] font-bold text-white cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 shadow-sm"
                        :style="{ marginLeft: visibleUsers.length > 0 ? '-8px' : '0' }"
                        @mouseenter="showMoreUsersTooltip($event)"
                        @mouseleave="hideUserTooltip"
                    >
                        +{{ moreUsersCount }}
                    </div>
                </div>
            </div>
            
            <!-- Статистика -->
            <div class="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-green-500"></div>
                    <span class="text-gray-700">{{ $t('online') || 'Онлайн' }}</span>
                </div>
                <span class="font-semibold text-gray-900">{{ onlineCount }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span class="text-gray-700">{{ $t('offline') || 'Оффлайн' }}</span>
                </div>
                <span class="font-semibold text-gray-900">{{ offlineCount }}</span>
            </div>
        </div>
        
        <div v-else class="text-sm text-gray-500 text-center py-2">
            {{ $t('noOnlineUsers') || 'Нет пользователей онлайн' }}
        </div>
    </div>

    <!-- Кастомный tooltip для имен пользователей (вне контейнера виджета) -->
    <Teleport to="body">
        <Transition name="tooltip-fade">
            <div 
                v-if="userTooltip.visible && userTooltip.user"
                class="user-tooltip"
                :style="userTooltip.style"
            >
                <div class="flex items-center gap-2">
                    <img 
                        v-if="userTooltip.user.photoUrl" 
                        :src="userTooltip.user.photoUrl" 
                        class="w-8 h-8 rounded-full object-cover border-2 border-white/20"
                        :alt="userTooltip.user.name"
                        @error="handleImageError"
                    />
                    <div v-else class="w-8 h-8 rounded-full bg-gray-100/20 flex items-center justify-center border-2 border-white/20">
                        <i class="fas fa-user text-white/80 text-xs"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-white truncate">{{ userTooltip.user.name }}</div>
                        <div v-if="userTooltip.user.position" class="text-xs text-white/80 truncate">{{ userTooltip.user.position }}</div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script>
import echo from '@/services/echo';
import { createChatRealtime } from '@/services/chatRealtime';
import UsersController from '@/api/UsersController';

export default {
    name: 'OnlineUsersWidget',
    data() {
        return {
            onlineUserIds: [],
            onlineUsers: [],
            totalUsers: 0,
            loading: false,
            realtime: null,
            userTooltip: {
                visible: false,
                user: null,
                style: {}
            }
        }
    },
    computed: {
        circumference() {
            return 2 * Math.PI * 16;
        },
        onlineCount() {
            return this.onlineUserIds.length;
        },
        offlineCount() {
            return Math.max(0, this.totalUsers - this.onlineCount);
        },
        circleProgress() {
            if (this.totalUsers === 0) return 0;
            return this.onlineCount / this.totalUsers;
        },
        strokeDashoffset() {
            return this.circumference / 2 - this.circleProgress * this.circumference;
        },
        visibleUsers() {
            return this.onlineUsers.slice(0, 7);
        },
        moreUsersCount() {
            return Math.max(0, this.onlineUsers.length - 7);
        }
    },
    async mounted() {
        await this.initPresence();
    },
    beforeUnmount() {
        this.cleanup();
    },
    watch: {
        '$store.getters.currentCompanyId'() {
            this.cleanup();
            this.initPresence();
        },
        onlineUserIds() {
            this.updateOnlineUsers();
        }
    },
    methods: {
        handleImageError(event) {
            event.target.style.display = 'none';
        },
        showUserTooltip(event, user) {
            const targetRect = event.currentTarget.getBoundingClientRect();
            
            // Используем fixed позиционирование относительно viewport
            const left = targetRect.left + targetRect.width / 2;
            const top = targetRect.bottom + 8;
            
            this.userTooltip = {
                visible: true,
                user: user,
                style: {
                    left: `${left}px`,
                    top: `${top}px`,
                    transform: 'translateX(-50%)'
                }
            };
        },
        hideUserTooltip() {
            this.userTooltip.visible = false;
        },
        showMoreUsersTooltip(event) {
            const moreUsers = this.onlineUsers.slice(7);
            if (moreUsers.length === 0) return;
            
            // Показываем имена остальных пользователей
            const names = moreUsers.map(u => u.name).join(', ');
            const fakeUser = {
                name: names,
                photoUrl: null
            };
            this.showUserTooltip(event, fakeUser);
        },
        async initPresence() {
            const companyId = this.$store.getters.currentCompanyId;
            if (!companyId) return;

            this.loading = true;

            try {
                const data = await UsersController.getItems(1, 1);
                this.totalUsers = data?.total || 0;
            } catch (error) {
                const users = this.$store.getters.usersForCurrentCompany || [];
                this.totalUsers = users.length;
            }

            if (!echo) {
                this.loading = false;
                return;
            }

            // Добавляем текущего пользователя в список онлайн сразу
            const currentUser = this.$store.state.user;
            if (currentUser && currentUser.id) {
                const currentUserId = Number(currentUser.id);
                if (!Number.isNaN(currentUserId)) {
                    this.onlineUserIds = [currentUserId];
                }
            }

            this.realtime = createChatRealtime(echo, {
                onPresenceHere: (users) => {
                    const ids = (users || []).map((u) => Number(u.id)).filter((id) => !Number.isNaN(id));
                    // Добавляем текущего пользователя, если его еще нет
                    const currentUser = this.$store.state.user;
                    if (currentUser && currentUser.id) {
                        const currentUserId = Number(currentUser.id);
                        if (!Number.isNaN(currentUserId) && !ids.includes(currentUserId)) {
                            ids.push(currentUserId);
                        }
                    }
                    this.onlineUserIds = [...ids];
                    this.updateOnlineUsers();
                },
                onPresenceJoining: (user) => {
                    const id = Number(user?.id);
                    if (Number.isNaN(id)) return;
                    if (!this.onlineUserIds.includes(id)) {
                        this.onlineUserIds = [...this.onlineUserIds, id];
                        this.updateOnlineUsers();
                    }
                },
                onPresenceLeaving: (user) => {
                    const id = Number(user?.id);
                    if (Number.isNaN(id)) return;
                    this.onlineUserIds = this.onlineUserIds.filter((uid) => uid !== id);
                    this.updateOnlineUsers();
                },
                onPresenceError: (err) => console.error('[OnlineUsersWidget] Ошибка presence:', err)
            });

            this.realtime.subscribePresence(companyId);
            this.loading = false;
            
            // Обновляем список пользователей сразу после инициализации
            this.updateOnlineUsers();
        },
        updateOnlineUsers() {
            const users = this.$store.getters.usersForCurrentCompany || [];
            this.onlineUsers = users
                .filter(user => user && user.id && this.onlineUserIds.includes(Number(user.id)))
                .map(user => {
                    let photoUrl = null;
                    if (user.photo) {
                        if (user.photo.startsWith('http')) {
                            photoUrl = user.photo;
                        } else {
                            const baseUrl = import.meta.env.VITE_APP_BASE_URL || '';
                            photoUrl = `${baseUrl}/storage/${user.photo}`;
                        }
                    } else if (user.photoUrl && typeof user.photoUrl === 'function') {
                        photoUrl = user.photoUrl();
                    }
                    return {
                        ...user,
                        name: user.fullName ? user.fullName() : `${user.name || ''} ${user.surname || ''}`.trim() || 'Пользователь',
                        position: user.position || null,
                        photoUrl
                    };
                });
        },
        cleanup() {
            if (this.realtime) {
                this.realtime.cleanup();
                this.realtime = null;
            }
            this.onlineUserIds = [];
            this.onlineUsers = [];
        }
    }
}
</script>

<style scoped>
.user-tooltip {
    position: fixed;
    background-color: #1f2937;
    padding: 0.625rem 0.875rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    z-index: 9999;
    pointer-events: none;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    min-width: 180px;
    max-width: 280px;
    white-space: normal;
    word-wrap: break-word;
    backdrop-filter: blur(8px);
}

.user-tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-bottom-color: #1f2937;
}

.tooltip-fade-enter-active {
    transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.tooltip-fade-leave-active {
    transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}

.tooltip-fade-enter-from {
    opacity: 0;
    transform: translateX(-50%) translateY(-5px);
}

.tooltip-fade-enter-to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.tooltip-fade-leave-from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.tooltip-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-5px);
}
</style>

