<template>
    <div class="relative inline-block" ref="dropdown">
        <PrimaryButton :onclick="toggleMenu" :isLight="true">
            <i class="fas fa-cog"></i>
        </PrimaryButton>

        <transition name="appear">
            <div
                v-if="isOpen"
                class="absolute right-0 mt-1 w-64 bg-white shadow-md rounded border border-gray-200 p-2 z-10"
            >
                <div class="text-xs font-semibold mb-2 text-gray-700">
                    {{ title || ($t('cardFields') || 'Поля карточки') }}
                </div>

                <ul>
                    <li
                        v-for="f in normalizedFields"
                        :key="f.name"
                        @click="toggleField(f)"
                        class="flex items-center hover:bg-gray-100 p-2 rounded cursor-pointer"
                        :class="{ 'opacity-60 pointer-events-none': f.locked }"
                    >
                        <div class="space-x-2 flex flex-row justify-between w-full select-none">
                            <div class="truncate">
                                <i
                                    class="text-sm mr-2 text-[#337AB7]"
                                    :class="[isFieldEnabled(f.name) ? 'fas fa-circle-check' : 'far fa-circle']"
                                ></i>
                                {{ f.label }}
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

