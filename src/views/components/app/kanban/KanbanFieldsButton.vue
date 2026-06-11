<template>
  <div
    ref="dropdown"
    class="relative inline-block"
  >
    <ToolbarIconButton
      icon="fas fa-cog"
      :aria-label="$t('kanbanCardFields')"
      @click="toggleMenu"
    />

    <transition name="appear">
      <div
        v-if="isOpen"
        class="absolute right-0 z-10 mt-1 w-56 rounded border border-gray-200 bg-white p-2 shadow-md dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.35)]"
      >
        <div class="kanban-fields-menu__title">
          {{ $t('kanbanCardFields') }}
        </div>
        <ul>
          <li
            v-for="(field, key) in availableFields"
            :key="key"
            class="flex cursor-pointer items-center rounded p-2 hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]"
            @click="toggleField(key)"
          >
            <div class="flex w-full select-none flex-row justify-between space-x-2">
              <div class="flex min-w-0 items-center gap-2 text-sm text-[var(--text-primary)]">
                <span class="filter-modal-icon-badge filter-modal-icon-badge--sm">
                  <i
                    :class="[fields[key] ? 'fas fa-circle-check' : 'far fa-circle', fields[key] ? 'text-[var(--color-success)]' : 'text-[var(--text-secondary)]']"
                  />
                </span>
                <span class="truncate">{{ $te(field.label) ? $t(field.label) : field.label }}</span>
              </div>
            </div>
          </li>
        </ul>
        <div class="flex flex-row-reverse gap-2 mt-2">
          <PrimaryButton
            :onclick="toggleMenu"
            :aria-label="$t('apply')"
          >
            <i class="fas fa-check" />
          </PrimaryButton>
          <PrimaryButton
            :onclick="resetFields"
            :is-danger="true"
            :aria-label="$t('reset')"
          >
            <i class="fas fa-undo" />
          </PrimaryButton>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import ToolbarIconButton from '@/views/components/app/buttons/ToolbarIconButton.vue';

export default {
    name: 'KanbanFieldsButton',
    components: { PrimaryButton, ToolbarIconButton },
    props: {
        mode: {
            type: String,
            required: true,
            validator: (value) => ['orders', 'projects', 'tasks', 'leads'].includes(value)
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
                    description: { label: 'description' },
                    createdAt: { label: 'createdAt' },
                    deadline: { label: 'deadline' },
                    supervisor: { label: 'supervisor' },
                    executor: { label: 'executor' },
                    checklist: { label: 'checklist' },
                };
            } else if (this.mode === 'leads') {
                return {
                    client: { label: 'client' },
                    note: { label: 'note' },
                    description: { label: 'description' },
                    date: { label: 'date' },
                    user: { label: 'creator' },
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

