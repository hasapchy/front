<template>
  <FiltersModal
    :show="show"
    :title="modalTitle"
    footer-mode="close"
    panel-class="md:max-w-sm md:min-w-[20rem]"
    @close-request="$emit('close')"
  >
    <div class="flex flex-col items-center gap-4">
      <CashRegisterIconBadge
        v-if="cashRegister"
        :cash-register="previewCashRegister"
        size="lg"
      />

      <div class="flex w-full items-center justify-between gap-3">
        <span class="text-sm text-gray-700 dark:text-[var(--text-primary)]">
          {{ useSystemColor ? $t('cashRegisterColorSystem') : $t('cashRegisterColorCustom') }}
        </span>
        <ToggleSwitch
          :model-value="useSystemColor"
          :aria-label="$t('cashRegisterColorSystem')"
          @update:model-value="onSystemColorToggle"
        />
      </div>

      <div
        v-if="!useSystemColor"
        class="grid w-full grid-cols-4 gap-3"
      >
        <button
          v-for="hex in CASH_REGISTER_PRESET_COLORS"
          :key="hex"
          type="button"
          class="relative mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-105"
          :class="selectedCustomColor === hex ? 'border-gray-900 dark:border-white' : 'border-transparent'"
          :style="{ backgroundColor: hex }"
          :aria-label="hex"
          @click="selectPreset(hex)"
        >
          <i
            v-if="selectedCustomColor === hex"
            class="fas fa-check text-xs text-white drop-shadow"
          />
        </button>
      </div>
    </div>
  </FiltersModal>
</template>

<script>
import FiltersModal from '@/views/components/app/forms/FiltersModal.vue';
import ToggleSwitch from '@/views/components/app/forms/ToggleSwitch.vue';
import CashRegisterIconBadge from '@/views/components/app/forms/CashRegisterIconBadge.vue';
import {
    CASH_REGISTER_PRESET_COLORS,
    getCashRegisterUserColorPreference,
    resolveCashRegisterId,
} from '@/utils/cashRegisterUserColors';
import {
    getCashRegisterDisplayNameByParts,
    getCashRegisterTypeLabel,
} from '@/utils/cashRegisterUtils';

export default {
    name: 'CashRegisterColorModal',
    components: { FiltersModal, ToggleSwitch, CashRegisterIconBadge },
    props: {
        show: { type: Boolean, default: false },
        cashRegister: { type: Object, default: null },
    },
    emits: ['close'],
    data() {
        return {
            CASH_REGISTER_PRESET_COLORS,
            useSystemColor: true,
            selectedCustomColor: CASH_REGISTER_PRESET_COLORS[0],
        };
    },
    computed: {
        cashRegisterId() {
            return resolveCashRegisterId(this.cashRegister);
        },
        modalTitle() {
            const card = this.cashRegister;
            if (!card) {
                return this.$t('cashRegisterColorTitle', { name: '' });
            }
            if (card.type === 'client_debts') {
                return this.$t('cashRegisterColorTitle', { name: this.$t('clientDebts') });
            }
            const typeLabel = getCashRegisterTypeLabel(card.isCash, this.$t);
            const name = getCashRegisterDisplayNameByParts(card.displayName || card.name, card.isCash, this.$t);
            const label = name ? `${typeLabel} — ${name}` : typeLabel;
            return this.$t('cashRegisterColorTitle', { name: label });
        },
        previewCashRegister() {
            if (!this.cashRegister) {
                return null;
            }
            const preview = {
                ...this.cashRegister,
                cashRegisterId: undefined,
                cashId: undefined,
                id: undefined,
            };
            if (!this.useSystemColor) {
                preview.color = this.selectedCustomColor;
            }
            return preview;
        },
    },
    watch: {
        show(visible) {
            if (visible) {
                this.syncFromPreference();
            }
        },
    },
    methods: {
        syncFromPreference() {
            const pref = this.cashRegisterId != null
                ? getCashRegisterUserColorPreference(this.cashRegisterId)
                : null;
            if (pref?.mode === 'custom' && pref.color) {
                this.useSystemColor = false;
                this.selectedCustomColor = CASH_REGISTER_PRESET_COLORS.includes(pref.color)
                    ? pref.color
                    : CASH_REGISTER_PRESET_COLORS[0];
                return;
            }
            this.useSystemColor = true;
        },
        onSystemColorToggle(useSystem) {
            this.useSystemColor = useSystem;
            if (this.cashRegisterId == null) {
                return;
            }
            if (useSystem) {
                this.persistPreference({ mode: 'system' });
                return;
            }
            this.persistPreference({ mode: 'custom', color: this.selectedCustomColor });
        },
        selectPreset(hex) {
            this.selectedCustomColor = hex;
            if (this.cashRegisterId == null) {
                return;
            }
            this.persistPreference({ mode: 'custom', color: hex });
        },
        persistPreference(preference) {
            this.$store.dispatch('setCashRegisterUserColorPreference', {
                cashRegisterId: this.cashRegisterId,
                preference,
            });
        },
    },
};
</script>
