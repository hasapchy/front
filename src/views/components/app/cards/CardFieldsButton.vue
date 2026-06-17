<template>
  <div
    ref="dropdown"
    class="relative inline-block"
  >
    <ToolbarIconButton
      icon="fas fa-cog"
      :aria-label="title || $t('cardFields')"
      @click="toggleMenu"
    />

    <transition name="appear">
      <div
        v-if="isOpen"
        class="absolute right-0 z-10 mt-1 w-64 rounded border border-gray-200 bg-white p-2 shadow-md dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.35)]"
      >
        <div class="mb-2 text-xs font-semibold text-gray-700 dark:text-[var(--text-secondary)]">
          {{ title || ($t('cardFields')) }}
        </div>

        <ul>
          <li
            v-for="f in normalizedFields"
            :key="f.name"
            class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded cursor-pointer"
            :class="{ 'opacity-60 pointer-events-none': f.locked }"
            @click="toggleFieldVisibility(f)"
          >
            <div class="space-x-2 flex flex-row justify-between w-full select-none items-center">
              <div class="truncate min-w-0">
                <i
                  class="text-sm mr-2 text-[var(--color-info)]"
                  :class="[isFieldEnabled(f.name) ? 'fas fa-circle-check' : 'far fa-circle']"
                />
                {{ f.label }}
              </div>
              <div
                v-if="isDateField(f)"
                class="inline-flex items-center gap-1"
                @click.stop
              >
                <button
                  type="button"
                  class="rounded border px-1.5 py-0.5 text-[10px] font-medium"
                  :class="resolveDateMode(f) === 'date'
                    ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)] text-white'
                    : 'border-gray-200 bg-white text-[var(--text-primary)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]'"
                  @click="setFieldDateMode(f, 'date')"
                >
                  {{ $t('dateOnly') }}
                </button>
                <button
                  type="button"
                  class="rounded border px-1.5 py-0.5 text-[10px] font-medium"
                  :class="resolveDateMode(f) === 'datetime'
                    ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)] text-white'
                    : 'border-gray-200 bg-white text-[var(--text-primary)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]'"
                  @click="setFieldDateMode(f, 'datetime')"
                >
                  {{ $t('dateTime') }}
                </button>
              </div>
            </div>
          </li>
        </ul>

        <div class="flex flex-row-reverse gap-2 mt-2">
          <PrimaryButton :onclick="toggleMenu">
            <i class="fas fa-check" />
          </PrimaryButton>
          <PrimaryButton
            :onclick="resetFields"
            :is-danger="true"
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
import { normalizeDateDisplayMode } from '@/utils/dateUtils';

export default {
    name: 'CardFieldsButton',
    components: { PrimaryButton, ToolbarIconButton },
    props: {
        storageKey: {
            type: String,
            required: true
        },
        fields: {
            type: Array,
            required: true
        },
        footerFields: {
            type: Array,
            default: () => []
        },
        title: {
            type: String,
            default: null
        }
    },
    data() {
        return {
            isOpen: false
        };
    },
    computed: {
        visibilityMap() {
            return this.$store.state.cardFields?.[this.storageKey] || {};
        },
        normalizedFields() {
            const allFields = [
                ...(this.fields || []),
                ...(this.footerFields || [])
            ];
            return allFields
                .filter((f) => f && f.name)
                .map((f) => ({
                    name: f.name,
                    label: f.label || f.name,
                    locked: f.required === true,
                    type: f.type,
                    dateDisplayMode: normalizeDateDisplayMode(f.type, this.visibilityMap?.[`${f.name}__dateDisplayMode`] ?? f.dateDisplayMode),
                }));
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
        isFieldEnabled(name) {
            return this.visibilityMap[name] !== false;
        },
        toggleFieldVisibility(field) {
            if (field.locked) {
                return;
            }
            const next = !this.isFieldEnabled(field.name);

            this.$store.commit('UPDATE_CARD_FIELDS', {
                storageKey: this.storageKey,
                fields: { [field.name]: next }
            });
        },
        isDateField(field) {
            return field?.type === 'date' || field?.type === 'datetime';
        },
        resolveDateMode(field) {
            return normalizeDateDisplayMode(field?.type, field?.dateDisplayMode);
        },
        setFieldDateMode(field, mode) {
            this.$store.commit('UPDATE_CARD_FIELDS', {
                storageKey: this.storageKey,
                fields: { [`${field.name}__dateDisplayMode`]: normalizeDateDisplayMode(field?.type, mode) }
            });
        },
        resetFields() {
            const next = {};
            this.normalizedFields.forEach((f) => {
                next[f.name] = true;
                if (this.isDateField(f)) {
                    next[`${f.name}__dateDisplayMode`] = normalizeDateDisplayMode(f.type, null);
                }
            });

            this.$store.commit('UPDATE_CARD_FIELDS', {
                storageKey: this.storageKey,
                fields: next
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

