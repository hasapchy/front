<template>
    <div class="relative inline-block" ref="dropdown">
        <PrimaryButton :onclick="toggleMenu" :isLight="true">
            <i class="fas fa-cog"></i>
        </PrimaryButton>

        <transition name="appear">
            <div v-if="isOpen"
                class="absolute right-0 mt-1 w-56 bg-white shadow-md rounded border border-gray-200 p-2 z-10">
                <div class="text-xs font-semibold mb-2 text-gray-700">
                    {{ $t('kanbanCardFields') || 'Поля карточки' }}
                </div>
                <ul>
                    <li v-for="(field, key) in availableFields" :key="key"
                        @click="toggleField(key)"
                        class="flex items-center hover:bg-gray-100 p-2 rounded cursor-pointer">
                        <div class="space-x-2 flex flex-row justify-between w-full select-none">
                            <div>
                                <i class="text-sm mr-2 text-[#337AB7]"
                                    :class="[fields[key] ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                {{ $te(field.label) ? $t(field.label) : field.label }}
                            </div>
                        </div>
                    </li>
                </ul>
                <div class="flex flex-row-reverse gap-2 mt-2">
                    <PrimaryButton :onclick="toggleMenu">
                        <i class="fas fa-check"></i>
                    </PrimaryButton>
                    <PrimaryButton :onclick="resetFields" :isDanger="true">
                        <i class="fas fa-undo"></i>
                    </PrimaryButton>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

export default {
    name: 'KanbanFieldsButton',
    components: { PrimaryButton },
    props: {
        mode: {
            type: String,
            required: true,
            validator: (value) => ['orders', 'projects', 'tasks'].includes(value)
        }
    },
    data() {
        return {
            isOpen: false
        };
    },
    computed: {
        fields() {
            return this.$store.state.kanbanCardFields[this.mode] || {};
        },
        availableFields() {
            if (this.mode === 'orders') {
                return {
                    cashRegister: { label: 'cashRegister' },
                    warehouse: { label: 'warehouse' },
                    client: { label: 'client' },
                    project: { label: 'project' },
                    products: { label: 'products' },
                    note: { label: 'note' },
                    description: { label: 'description' },
                    date: { label: 'date' },
                    user: { label: 'user' },
                    totalPrice: { label: 'total' },
                };
            } else if (this.mode === 'tasks') {
                return {
                    created_at: { label: 'createdAt' },
                    deadline: { label: 'deadline' },
                    creator: { label: 'creator' },
                    supervisor: { label: 'supervisor' },
                    executor: { label: 'executor' },
                };
            } else {
                return {
                    description: { label: 'description' },
                    date: { label: 'date' },
                    client: { label: 'client' },
                    user: { label: 'creator' },
                    budget: { label: 'projectBudget' },
                };
            }
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        toggleMenu() {
            this.isOpen = !this.isOpen;
        },
        toggleField(fieldKey) {
            const currentFields = { ...this.fields };
            currentFields[fieldKey] = !currentFields[fieldKey];
            this.$store.commit('UPDATE_KANBAN_CARD_FIELDS', {
                mode: this.mode,
                fields: currentFields
            });
        },
        resetFields() {
            const defaultFields = {};
            Object.keys(this.availableFields).forEach(key => {
                defaultFields[key] = true;
            });
            this.$store.commit('UPDATE_KANBAN_CARD_FIELDS', {
                mode: this.mode,
                fields: defaultFields
            });
        },
        handleClickOutside(event) {
            const dropdown = this.$refs.dropdown;
            if (this.isOpen && dropdown && !dropdown.contains(event.target)) {
                this.isOpen = false;
            }
        }
    }
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

