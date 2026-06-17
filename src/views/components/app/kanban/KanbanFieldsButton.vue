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
        class="absolute right-0 z-10 mt-1 w-[clamp(15rem,32vw,24rem)] max-w-[calc(100vw-1rem)] rounded border border-gray-200 bg-white p-2 shadow-md dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.35)]"
      >
        <div class="kanban-fields-menu__title">
          {{ $t('kanbanCardFields') }}
        </div>
        <div
          v-if="dateFieldEntries.length"
          class="mb-2 border-b border-gray-200 pb-2 dark:border-[var(--border-subtle)]"
        >
          <TableDateDisplayModeHint />
          <div
            v-for="entry in dateFieldEntries"
            :key="`kanban-date-mode-${entry.key}`"
            class="mb-1 rounded bg-gray-50 px-2 py-1.5 dark:bg-[var(--surface-muted)]"
          >
            <div class="flex w-full items-center gap-1">
              <button
                type="button"
                class="flex-1 rounded border px-2 py-1 text-[10px] font-medium"
                :class="resolveDateMode(entry.key, entry.field) === 'date'
                  ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)] text-white'
                  : 'border-gray-200 bg-white text-[var(--text-primary)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]'"
                @click.stop="setDateDisplayMode(entry.key, entry.field, 'date')"
              >
                {{ $t('dateOnly') }}
              </button>
              <button
                type="button"
                class="flex-1 rounded border px-2 py-1 text-[10px] font-medium"
                :class="resolveDateMode(entry.key, entry.field) === 'datetime'
                  ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)] text-white'
                  : 'border-gray-200 bg-white text-[var(--text-primary)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]'"
                @click.stop="setDateDisplayMode(entry.key, entry.field, 'datetime')"
              >
                {{ $t('dateTime') }}
              </button>
            </div>
          </div>
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
import TableDateDisplayModeHint from '@/views/components/app/forms/TableDateDisplayModeHint.vue';
import { normalizeDateDisplayMode } from '@/utils/dateUtils';

export default {
    name: 'KanbanFieldsButton',
    components: { PrimaryButton, ToolbarIconButton, TableDateDisplayModeHint },
    props: {
        mode: {
            type: String,
            required: true,
            validator: (value) => value === 'leads'
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
        dateModes() {
            return this.$store.state.kanbanCardFieldDateModes?.[this.mode] || {};
        },
        availableFields() {
            return {
                client: { label: 'client' },
                note: { label: 'note' },
                description: { label: 'description' },
                date: { label: 'date', type: 'datetime' },
                user: { label: 'creator' },
            };
        },
        dateFieldEntries() {
            return Object.entries(this.availableFields)
                .filter(([, field]) => this.isDateField(field))
                .map(([key, field]) => ({ key, field }));
        },
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
        isDateField(field) {
            return field?.type === 'date' || field?.type === 'datetime';
        },
        resolveDateMode(fieldKey, field) {
            return normalizeDateDisplayMode(field?.type, this.dateModes[fieldKey]);
        },
        setDateDisplayMode(fieldKey, field, mode) {
            if (!this.isDateField(field)) {
                return;
            }
            this.$store.commit('UPDATE_KANBAN_CARD_FIELD_DATE_MODES', {
                mode: this.mode,
                fields: { [fieldKey]: normalizeDateDisplayMode(field.type, mode) }
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
            const defaultModes = {};
            Object.entries(this.availableFields).forEach(([key, field]) => {
                if (this.isDateField(field)) {
                    defaultModes[key] = normalizeDateDisplayMode(field.type, null);
                }
            });
            if (Object.keys(defaultModes).length) {
                this.$store.commit('UPDATE_KANBAN_CARD_FIELD_DATE_MODES', {
                    mode: this.mode,
                    fields: defaultModes
                });
            }
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
