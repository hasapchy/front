<template>
  <div
    ref="dropdown"
    class="relative inline-block"
  >
    <PrimaryButton
      :onclick="toggleMenu"
      :is-light="true"
    >
      <i class="fas fa-cog text-[var(--nav-accent)]" />
    </PrimaryButton>

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
            @click="toggleField(f)"
          >
            <div class="space-x-2 flex flex-row justify-between w-full select-none">
              <div class="truncate">
                <i
                  class="text-sm mr-2 text-[#337AB7]"
                  :class="[isFieldEnabled(f.name) ? 'fas fa-circle-check' : 'far fa-circle']"
                />
                {{ f.label }}
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

export default {
    name: 'CardFieldsButton',
    components: { PrimaryButton },
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
                    locked: f.required === true
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
        toggleField(field) {
            if (field.locked) {
                return;
            }
            const next = !this.isFieldEnabled(field.name);

            this.$store.commit('UPDATE_CARD_FIELDS', {
                storageKey: this.storageKey,
                fields: { [field.name]: next }
            });
        },
        resetFields() {
            const next = {};
            this.normalizedFields.forEach((f) => {
                next[f.name] = true;
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

