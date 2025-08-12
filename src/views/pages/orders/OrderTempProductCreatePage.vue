<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Создать временный товар</h2>
        
        <div class="space-y-4">
            <div>
                <label class="required">Название товара</label>
                <input type="text" v-model="name" required class="w-full border rounded p-2" />
            </div>
            
            <div>
                <label>Описание</label>
                <textarea v-model="description" class="w-full border rounded p-2" rows="3"></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="required">Количество</label>
                    <input type="number" v-model.number="quantity" required min="0.01" step="0.01" class="w-full border rounded p-2" />
                </div>
                
                <div>
                    <label class="required">Цена</label>
                    <input type="number" v-model.number="price" required min="0" step="0.01" class="w-full border rounded p-2" />
                </div>
            </div>
            
            <div>
                <label class="required">Единица измерения</label>
                <select v-model="unitId" required class="w-full border rounded p-2">
                    <option value="">Выберите единицу</option>
                    <option v-for="unit in allUnits" :key="unit.id" :value="unit.id">
                        {{ unit.name }} ({{ unit.short_name }})
                    </option>
                </select>
            </div>
        </div>
    </div>
    
    <div class="mt-4 p-4 flex items-center justify-between bg-[#edf4fb] gap-4">
        <div class="flex items-center space-x-2">
            <PrimaryButton icon="fas fa-check" :onclick="save" :is-loading="saveLoading">
                Создать
            </PrimaryButton>
        </div>
        
        <div class="text-sm text-gray-700 font-medium">
            Итого: <span class="font-bold">{{ totalPrice.toFixed(2) }}</span>
        </div>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AppController from '@/api/AppController';
import OrderTempProductDto from '@/dto/order/OrderTempProductDto';

export default {
    components: { PrimaryButton },
    emits: ['saved', 'saved-error'],
    props: {
        defaultName: {
            type: String,
            default: ''
        },
        editingItem: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            name: this.editingItem?.name ?? this.defaultName,
            description: this.editingItem?.description ?? '',
            quantity: this.editingItem?.quantity ?? 1,
            price: this.editingItem?.price ?? 0,
            unitId: this.editingItem?.unitId ?? '',
            allUnits: [],
            saveLoading: false,
        };
    },
    computed: {
        totalPrice() {
            return this.quantity * this.price;
        }
    },
    created() {
        this.fetchAllUnits();
    },
    methods: {
        async fetchAllUnits() {
            try {
                this.allUnits = await AppController.getUnits();
            } catch (error) {
                console.error('Ошибка загрузки единиц измерения:', error);
            }
        },
        
        async save() {
            if (!this.name.trim()) {
                this.$emit('saved-error', 'Название товара обязательно');
                return;
            }
            
            if (this.quantity <= 0) {
                this.$emit('saved-error', 'Количество должно быть больше 0');
                return;
            }
            
            if (this.price < 0) {
                this.$emit('saved-error', 'Цена не может быть отрицательной');
                return;
            }
            if (!this.unitId) {
                this.$emit('saved-error', 'Единица измерения обязательна');
                return;
            }
            
            this.saveLoading = true;
            
            try {
                const tempProduct = new OrderTempProductDto({
                    name: this.name.trim(),
                    description: this.description.trim(),
                    quantity: this.quantity,
                    price: this.price,
                    unitId: this.unitId,
                });
                
                this.$emit('saved', tempProduct);
            } catch (error) {
                this.$emit('saved-error', error.message || 'Ошибка создания товара');
            } finally {
                this.saveLoading = false;
            }
        }
    }
};
</script>
