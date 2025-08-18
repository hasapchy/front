<template>
    <div class="relative">
        <div class="relative">
            <button @click="toggleDropdown" type="button" class="custom-dropdown-button">
                <span>
                    {{ getFilterText() }}
                </span>
                <i class="fas fa-chevron-down"></i>
            </button>

            <!-- Выпадающий список с чекбоксами -->
            <div v-if="showDropdown" class="absolute z-10 mt-1 w-48 bg-white border rounded-md shadow-lg">
                <div class="p-2 space-y-2">
                    <label
                        v-for="option in options"
                        :key="option.value"
                        class="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer">
                        <input 
                            type="checkbox" 
                            :value="option.value" 
                            v-model="localValue" 
                            @change="handleChange"
                        >
                        <span>{{ option.label }}</span>
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CheckboxFilter',
    props: {
        modelValue: {
            type: Array,
            default: () => []
        },
        options: {
            type: Array,
            required: true,
            // Каждый элемент должен иметь { value: string, label: string }
        },
        placeholder: {
            type: String,
            default: 'all'
        }
    },
    data() {
        return {
            showDropdown: false,
            localValue: [...this.modelValue]
        }
    },
    watch: {
        modelValue: {
            handler(newValue) {
                this.localValue = [...newValue];
            },
            deep: true
        }
    },
    mounted() {
        // Добавляем слушатель кликов для закрытия выпадающего списка
        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        // Удаляем слушатель кликов
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        toggleDropdown() {
            this.showDropdown = !this.showDropdown;
        },
        getFilterText() {
            if (this.localValue.length === 0) {
                return this.$t(this.placeholder);
            }
            return this.localValue.map(value => {
                const option = this.options.find(opt => opt.value === value);
                return option ? option.label : value;
            }).join(', ');
        },
        handleChange() {
            this.$emit('update:modelValue', [...this.localValue]);
            this.$emit('change', [...this.localValue]);
        },
        handleClickOutside(event) {
            // Закрываем выпадающий список при клике вне его области
            const dropdown = event.target.closest('.relative');
            if (!dropdown || !dropdown.contains(event.target)) {
                this.showDropdown = false;
            }
        }
    }
}
</script>

<style scoped>
/* Стили уже определены в app.css для .custom-dropdown-button */
</style>
