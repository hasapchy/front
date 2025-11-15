<template>
    <div id="settings-sidebar" :key="permissionsKey"
        class="w-50 bg-[#53585C] text-white flex-shrink-0 transform transition-transform duration-300">
        <div v-if="permissionsLoaded">
            <ul>
                <draggable
                    :list="draggableAvailableItems"
                    @change="onDragChange"
                    :animation="200"
                    handle=".drag-handle"
                    item-key="id"
                >
                    <SidebarLink 
                        v-for="element in draggableAvailableItems"
                        :key="element.id"
                        :to="element.to" 
                        :icon="element.icon"
                        :settings="true"
                        class="relative group"
                    >
                        <span class="flex items-center justify-between w-full">
                            <span>{{ $t(element.label) }}</span>
                            <i class="fas fa-grip-vertical drag-handle opacity-0 group-hover:opacity-50 cursor-move ml-2 text-xs"></i>
                        </span>
                    </SidebarLink>
                </draggable>
            </ul>
        </div>
    </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import SidebarLink from './SidebarLink.vue';

export default {
    components: {
        draggable: VueDraggableNext,
        SidebarLink
    },
    data() {
        return {
            draggableAvailableItems: []
        };
    },
    computed: {
        availableMenuItems() {
            return this.$store.getters.availableMenuItems;
        },
        permissionsKey() {
            const perms = this.$store.state.permissions;
            return Array.isArray(perms) && perms.length > 0 ? perms.join(',') : 'no-permissions';
        },
        permissionsLoaded() {
            if (!this.$store.state.user) {
                return true;
            }
            return this.$store.state.permissionsLoaded;
        }
    },
    async mounted() {
        if (!this.$store.state.menuItems || !this.$store.state.menuItems.available || this.$store.state.menuItems.available.length === 0) {
            await this.$store.dispatch('initializeMenu');
        }
        this.$nextTick(() => {
            this.updateDraggableItems();
        });
    },
    watch: {
        '$store.state.permissions': {
            handler() {
                this.$forceUpdate();
            },
            deep: true
        },
        availableMenuItems: {
            handler() {
                this.$nextTick(() => {
                    this.updateDraggableItems();
                });
            },
            immediate: true
        }
    },
    methods: {
        updateDraggableItems() {
            this.draggableAvailableItems = [...(this.availableMenuItems || [])];
        },
        onDragChange() {
            this.$store.dispatch('updateMenuItems', { 
                type: 'available', 
                items: [...this.draggableAvailableItems]
            });
        }
    }
}
</script>
