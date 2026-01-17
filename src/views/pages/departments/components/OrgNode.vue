<template>
    <div 
        class="org-node-container flex flex-col items-center relative"
        :style="{ width: nodeWidth + 'px' }"
        :data-level="level"
    >
        <!-- Node Card -->
        <div 
            class="node-card bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 w-72 group relative cursor-pointer hover:shadow-md hover:border-[#337AB7] hover:ring-2 hover:ring-[#337AB7]/20"
            @click="handleCardClick"
        >
            <!-- Top Badge -->
            <div v-if="!node.parentId" class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#337AB7] text-white text-[10px] font-semibold px-3 py-0.5 rounded-full uppercase tracking-wide shadow-sm z-10">
                Департамент
            </div>

            <!-- "My Department" Indicator -->
            <div v-if="isMyDepartment" class="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
            </div>

            <!-- Card Header -->
            <div class="px-4 pt-4 pb-3 border-b border-gray-200 flex justify-between items-start">
                <div class="flex-1 min-w-0 pr-2">
                    <h3 class="text-sm font-bold text-gray-900 truncate leading-tight mb-1">
                        {{ node.title }}
                    </h3>
                    <div v-if="node.description" class="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {{ node.description }}
                    </div>
                </div>
                
                <!-- Add Button -->
                <div class="flex items-center flex-shrink-0">
                    <button 
                        v-if="$store.getters.hasPermission('departments_create')"
                        @click.stop="$emit('add-child', node.id)"
                        class="px-3 py-1.5 text-xs font-semibold text-[#5CB85C] hover:text-white hover:bg-[#5CB85C] rounded-md transition-all duration-200 flex items-center gap-1.5"
                        title="Добавить подотдел"
                    >
                        <i class="fas fa-plus text-[10px]"></i>
                        <span>Добавить</span>
                    </button>
                </div>
            </div>

            <!-- Card Body (Head Info) -->
            <div class="px-4 py-4 bg-white">
                <div class="flex items-start">
                    <div class="relative flex-shrink-0">
                        <img 
                            v-if="node.head && node.head.photo && typeof node.head.photoUrl === 'function'" 
                            :src="node.head.photoUrl()" 
                            class="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                            @error="onImgError"
                            :alt="node.head ? `${node.head.name || ''} ${node.head.surname || ''}`.trim() || 'Руководитель' : 'Руководитель'"
                        >
                        <div v-else class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-100">
                            <i class="fas fa-user text-gray-400 text-lg" aria-hidden="true"></i>
                        </div>
                        
                        <div class="absolute -bottom-0.5 -right-0.5 bg-[#337AB7] text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm" title="Руководитель">
                            <i class="fas fa-star text-[9px]"></i>
                        </div>
                    </div>
                    
                    <div class="ml-3 flex-1 min-w-0">
                        <div class="text-sm font-semibold text-gray-900 truncate">
                            {{ node.head && (node.head.name || node.head.surname) ? `${node.head.name || ''} ${node.head.surname || ''}`.trim() : 'Не назначен' }}
                        </div>
                        <div class="text-xs text-gray-500 truncate mt-0.5">
                            {{ node.head && node.head.position ? node.head.position : 'Руководитель' }}
                        </div>
                        <!-- Deputy Head Info (compact, if exists) -->
                        <div v-if="node.deputyHead" class="text-xs text-gray-500 truncate mt-2 flex items-center gap-1.5">
                            <i class="fas fa-user-tie text-[10px] text-[#5CB85C]"></i>
                            <span>{{ node.deputyHead && (node.deputyHead.name || node.deputyHead.surname) ? `${node.deputyHead.name || ''} ${node.deputyHead.surname || ''}`.trim() : 'Заместитель' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card Footer -->
            <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-3 rounded-b-lg">
                <div class="flex items-center text-[#337AB7] text-xs font-medium">
                    <i class="fas fa-users mr-2 text-[#337AB7]/60"></i>
                    <span>{{ node.users_count || 0 }} {{ getUsersCountText(node.users_count || 0) }}</span>
                </div>
                
                <!-- User Avatars -->
                <div v-if="node.users && node.users.length > 0" class="flex items-center -space-x-2">
                    <template v-for="(user, index) in node.users.slice(0, 5)" :key="user.id">
                        <img 
                            v-if="user.photo && typeof user.photoUrl === 'function'" 
                            :src="user.photoUrl()" 
                            class="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm"
                            :alt="`${user.name || ''} ${user.surname || ''}`.trim() || 'Сотрудник'"
                            :title="`${user.name || ''} ${user.surname || ''}`.trim() || 'Сотрудник'"
                        >
                        <div 
                            v-else
                            class="w-7 h-7 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center"
                            :title="`${user.name || ''} ${user.surname || ''}`.trim() || 'Сотрудник'"
                        >
                            <i class="fas fa-user text-gray-400 text-[10px]"></i>
                        </div>
                    </template>
                    <div 
                        v-if="node.users.length > 5"
                        class="w-7 h-7 rounded-full bg-[#337AB7] border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-semibold text-white"
                        :title="`Еще ${node.users.length - 5} сотрудников`"
                    >
                        +{{ node.users.length - 5 }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Children Row -->
        <div v-if="node.children.length > 0" class="relative flex flex-col items-center mt-28">
            <!-- Children Cards -->
            <div class="relative flex items-start" :style="childrenContainerStyle">
                <template v-for="child in node.children" :key="child.id">
                    <div class="mx-4">
                        <OrgNode 
                            :node="child"
                            :level="level + 1"
                            @edit="$emit('edit', $event)" 
                            @add-child="$emit('add-child', $event)"
                            @delete="$emit('delete', $event)"
                        />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
const CARD_WIDTH = 288; // w-72
const HORIZONTAL_GAP = 40; // space between cards

export default {
    name: 'OrgNode',
    props: {
        node: {
            type: Object,
            required: true
        },
        level: {
            type: Number,
            default: 0
        }
    },
    computed: {
        isMyDepartment() {
            const currentUser = this.$store.state.user;
            if (!currentUser || !this.node.users) return false;
            return this.node.users.some(u => u.id === currentUser.id);
        },
        nodeWidth() {
            return this.getSubtreeWidth(this.node);
        },
        childrenContainerStyle() {
            const count = this.node.children.length;
            if (!count) return {};

            const widths = this.node.children.map(child => this.getSubtreeWidth(child));
            const gaps = HORIZONTAL_GAP * Math.max(count - 1, 0);
            const totalWidth = widths.reduce((acc, width) => acc + width, 0) + gaps;
            
            return {
                width: `${totalWidth}px`,
                columnGap: `${HORIZONTAL_GAP}px`
            };
        }
    },
    methods: {
        getSubtreeWidth(node) {
            if (!node) return CARD_WIDTH;
            const children = node.children || [];
            if (!children.length) {
                return CARD_WIDTH;
            }

            const childWidths = children.map(child => this.getSubtreeWidth(child));
            const gaps = HORIZONTAL_GAP * Math.max(children.length - 1, 0);
            const childrenWidth = childWidths.reduce((acc, width) => acc + width, 0) + gaps;

            return Math.max(CARD_WIDTH, childrenWidth);
        },
        onImgError(e) {
            if (e.target && e.target.nextElementSibling) {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
            }
        },
        handleCardClick() {
            if (this.$store.getters.hasPermission('departments_update_all')) {
                this.$emit('edit', this.node);
            }
        },
        getUsersCountText(count) {
            const lastDigit = count % 10;
            const lastTwoDigits = count % 100;
            
            if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
                return 'сотрудников';
            }
            
            if (lastDigit === 1) {
                return 'сотрудник';
            }
            
            if (lastDigit >= 2 && lastDigit <= 4) {
                return 'сотрудника';
            }
            
            return 'сотрудников';
        }
    }
};
</script>

<style scoped>
.node-card {
    transition: all 0.2s ease;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
