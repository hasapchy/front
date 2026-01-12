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
        
        <div v-else-if="onlineUsers.length > 0" class="space-y-4">
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
                            :stroke-dashoffset="circumference / 2 - (onlineCount / totalUsers) * circumference"
                            stroke-linecap="round"
                        />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-lg font-bold text-gray-900">{{ onlineCount }}</span>
                    </div>
                </div>
                
                <!-- Аватары онлайн пользователей -->
                <div class="flex-1 flex items-center gap-1.5 overflow-hidden">
                    <div 
                        v-for="(user, index) in visibleUsers" 
                        :key="user.id"
                        class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border-2 border-white shrink-0 flex items-center justify-center relative"
                        :style="{ marginLeft: index > 0 ? '-8px' : '0' }"
                        :title="user.name"
                    >
                        <img 
                            v-if="user.photoUrl" 
                            :src="user.photoUrl" 
                            class="w-full h-full object-cover"
                            :alt="user.name"
                            @error="handleImageError"
                        />
                        <i v-else class="fas fa-user text-gray-400 text-xs"></i>
                        <!-- Зеленый индикатор онлайн -->
                        <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white"></span>
                    </div>
                    <div 
                        v-if="moreUsersCount > 0"
                        class="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shrink-0 flex items-center justify-center text-xs font-semibold text-gray-600"
                        :style="{ marginLeft: visibleUsers.length > 0 ? '-8px' : '0' }"
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
</template>

<script>
import echo from '@/services/echo';
import { createChatRealtime } from '@/services/chatRealtime';

export default {
    name: 'OnlineUsersWidget',
    data() {
        return {
            onlineUserIds: [],
            onlineUsers: [],
            totalUsers: 0,
            loading: false,
            realtime: null
        }
    },
    computed: {
        circumference() {
            return 2 * Math.PI * 16; // радиус 16
        },
        onlineCount() {
            return this.onlineUserIds.length;
        },
        offlineCount() {
            return Math.max(0, this.totalUsers - this.onlineCount);
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
        async initPresence() {
            const companyId = this.$store.getters.currentCompanyId;
            if (!companyId) return;

            // Получаем всех пользователей компании
            const users = this.$store.getters.usersForCurrentCompany || [];
            this.totalUsers = users.length;

            // Инициализируем realtime для presence
            if (!echo) {
                console.warn('[OnlineUsersWidget] Echo не инициализирован');
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
</style>

