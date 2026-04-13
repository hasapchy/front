<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div class="space-y-4">
      <div>
        <label class="required">{{ $t('productName') }}</label>
        <input
          v-model="name"
          type="text"
          required
          class="w-full border rounded p-2"
        >
      </div>
            
      <div>
        <label>{{ $t('description') }}</label>
        <textarea
          v-model="description"
          class="w-full border rounded p-2"
          rows="3"
        />
      </div>
            
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="required">{{ $t('quantity') }}</label>
          <FormattedDecimalInput
            v-model="quantity"
            variant="quantity"
            required
            min="0.01"
            class="w-full border rounded p-2"
          />
        </div>
                
        <div>
          <label class="required">{{ $t('price') }}</label>
          <FormattedDecimalInput
            v-model="price"
            variant="amount"
            required
            min="0"
            class="w-full border rounded p-2"
          />
        </div>
      </div>
            
      <div>
        <label class="required">Единица измерения</label>
        <select
          v-model="unitId"
          required
          class="w-full border rounded p-2"
        >
          <option value="">
            Выберите единицу
          </option>
          <option
            v-for="unit in allUnits"
            :key="unit.id"
            :value="unit.id"
          >
            {{ translateUnit(unit.name, $t) }} ({{ unit.short_name }})
          </option>
        </select>
      </div>
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-2">
          <PrimaryButton
            icon="fas fa-check"
            :onclick="save"
            :is-loading="saveLoading"
          />
        </div>
        <div class="text-sm text-gray-700 font-medium">
          Итого: <span class="font-bold">{{ $formatNumber(totalPrice, null, true) }}</span>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import OrderTempProductDto from '@/dto/order/OrderTempProductDto';
import { translateUnit } from '@/utils/translationUtils';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';

export default {
    components: { PrimaryButton },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
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
    emits: ['saved', 'saved-error'],
    data() {
        return {
            name: this.editingItem?.name ?? this.defaultName,
            description: this.editingItem?.description ?? '',
            quantity: this.editingItem?.quantity ?? 1,
            price: this.editingItem?.price ?? 0,
            unitId: this.editingItem?.unitId ?? '',
            allUnits: [],
        };
    },
    computed: {
        totalPrice() {
            return this.quantity * this.price;
        }
    },
    watch: {
        defaultName: {
            handler(newValue) {
                if (newValue && !this.name) {
                    this.name = newValue;
                }
            },
            immediate: true
        }
    },
    created() {
        this.fetchAllUnits();
    },
    methods: {
        translateUnit,
        async fetchAllUnits() {
            try {
                await this.$store.dispatch('loadUnits');
                this.allUnits = this.$store.getters.units;
            } catch {
                this.allUnits = [];
            }
        },
        
        getFormState() {
            return {
                name: this.name,
                description: this.description,
                quantity: this.quantity,
                price: this.price,
                unitId: this.unitId,
            };
        },
        prepareSave() {
            if (!this.name.trim()) {
                throw new Error(this.$t('productNameRequired'));
            }
            if (this.quantity <= 0) {
                throw new Error(this.$t('quantityMustBePositive'));
            }
            if (this.price < 0) {
                throw new Error(this.$t('priceCannotBeNegative'));
            }
            if (!this.unitId) {
                throw new Error(this.$t('allRequiredFieldsMustBeFilled'));
            }
            return new OrderTempProductDto({
                name: this.name.trim(),
                description: this.description.trim(),
                quantity: this.quantity,
                price: this.price,
                unitId: this.unitId,
            });
        },
        async performSave(data) {
            return data;
        },
        async save() {
            return crudFormMixin.methods.save.call(this);
        },
        onSaveSuccess() {
            this.clearForm();
        },
        
        clearForm() {
            this.name = this.defaultName ;
            this.description = '';
            this.quantity = 1;
            this.price = 0;
            this.unitId = '';
        }
    }
};
</script>
