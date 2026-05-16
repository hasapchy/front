<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-600 dark:text-[var(--text-secondary)]">
      {{ $t('productPackagingIntro') }}
    </p>
    <p
      v-if="readOnly"
      class="text-sm text-gray-600 dark:text-[var(--text-secondary)]"
    >
      {{ $t('unitPackagingReadonly') }}
    </p>
    <p
      v-else-if="!baseUnitId"
      class="text-sm text-amber-700 dark:text-amber-400"
    >
      {{ $t('productPackagingSelectBaseUnit') }}
    </p>
    <template v-else>
      <div
        v-if="!readOnly"
        class="flex flex-wrap items-end gap-3 border-b border-gray-200 pb-4 dark:border-[var(--border-subtle)]"
      >
        <div class="flex min-w-[140px] flex-col">
          <label class="mb-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">{{ $t('unitPackagingThisUnitAs') }}</label>
          <select v-model="addRole">
            <option value="parent">
              {{ $t('unitPackagingAsParent') }}
            </option>
            <option value="child">
              {{ $t('unitPackagingAsChild') }}
            </option>
          </select>
        </div>
        <div class="flex min-w-[160px] flex-1 flex-col">
          <label class="mb-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">{{ $t('unitPackagingSecondUnit') }}</label>
          <select v-model.number="addOtherUnitId">
            <option :value="0">
              —
            </option>
            <option
              v-for="o in otherUnitOptions"
              :key="o.id"
              :value="o.id"
            >
              {{ optionUnitLabel(o) }}
            </option>
          </select>
        </div>
        <div class="flex w-28 flex-col">
          <label class="mb-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">{{ $t('quantity') }}</label>
          <input
            :value="addQuantity"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            @input="onAddQuantityInput"
          >
        </div>
        <PrimaryButton
          :disabled="!canAdd"
          :onclick="createRow"
        >
          {{ $t('add') }}
        </PrimaryButton>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-[var(--surface-muted)]">
            <tr>
              <th class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]">
                {{ $t('unitPackagingRelationColumn') }}
              </th>
              <th
                v-if="!readOnly"
                class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]"
              />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, idx) in displayRows"
              :key="`${r.parent_unit_id}-${r.child_unit_id}-${idx}`"
            >
              <td class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]">
                <template v-if="editingIndex === idx && !readOnly">
                  <span class="inline-flex flex-wrap items-center gap-x-1 gap-y-1 align-middle">
                    <span>{{ packagingParentParen(r) }}</span>
                    <span class="whitespace-nowrap text-gray-600 dark:text-[var(--text-secondary)]">{{ $t('unitPackagingRelationMid') }}</span>
                    <input
                      :value="editDraftQty"
                      type="text"
                      inputmode="decimal"
                      autocomplete="off"
                      class="w-28 rounded border border-gray-300 bg-[var(--input-bg)] p-1 dark:border-[var(--input-border)]"
                      @input="onEditQuantityInput"
                    >
                    <span>{{ packagingChildParen(r) }}</span>
                  </span>
                </template>
                <template v-else>
                  {{ packagingRelationSentence(r, formatRowQuantity(r.quantity)) }}
                </template>
              </td>
              <td
                v-if="!readOnly"
                class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]"
              >
                <template v-if="editingIndex === idx">
                  <button
                    type="button"
                    class="mr-2 text-green-600 hover:underline"
                    @click="saveEdit(idx)"
                  >
                    {{ $t('save') }}
                  </button>
                  <button
                    type="button"
                    class="mr-2 text-gray-600 hover:underline"
                    @click="cancelEdit"
                  >
                    {{ $t('cancel') }}
                  </button>
                </template>
                <template v-else>
                  <button
                    type="button"
                    class="mr-2 text-[#337AB7] hover:underline"
                    @click="startEdit(idx, r)"
                  >
                    {{ $t('edit') }}
                  </button>
                  <button
                    type="button"
                    class="text-red-600 hover:underline"
                    @click="removeRow(idx)"
                  >
                    {{ $t('delete') }}
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import { formatQuantity } from '@/utils/numberUtils';

export default {
  name: 'ProductPackagingTab',
  components: { PrimaryButton },
  props: {
    modelValue: { type: Array, default: () => [] },
    baseUnitId: { type: [Number, String], default: null },
    readOnly: { type: Boolean, default: false },
    unitOptions: { type: Array, required: true },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      addRole: 'parent',
      addOtherUnitId: 0,
      addQuantity: '1',
      editingIndex: null,
      editDraftQty: '1',
    };
  },
  computed: {
    baseUid() {
      const n = Number(this.baseUnitId);
      return Number.isFinite(n) && n > 0 ? n : NaN;
    },
    otherUnitOptions() {
      if (!Number.isFinite(this.baseUid)) {
        return this.unitOptions;
      }
      return this.unitOptions.filter((u) => Number(u.id) !== this.baseUid);
    },
    displayRows() {
      const list = Array.isArray(this.modelValue) ? this.modelValue : [];
      return list.map((r) => ({
        parent_unit_id: Number(r.parent_unit_id),
        child_unit_id: Number(r.child_unit_id),
        quantity: r.quantity,
        parent_short_name: r.parent_short_name ?? r.parentShortName,
        child_short_name: r.child_short_name ?? r.childShortName,
      }));
    },
    canAdd() {
      const q = this.parseQuantityInput(this.addQuantity);
      return this.addOtherUnitId > 0 && q !== null && q > 0;
    },
  },
  watch: {
    baseUnitId() {
      this.cancelEdit();
    },
  },
  methods: {
    optionUnitLabel(o) {
      const short = String((o.short_name ?? o.shortName ?? '')).trim();
      const name = String((o.name ?? '')).trim();
      if (short && name) {
        return `${short} (${name})`;
      }
      return name || short || '—';
    },
    packagingParentParen(r) {
      const u = this.unitOptions.find((x) => Number(x.id) === Number(r.parent_unit_id));
      const name = String((u?.name ?? '')).trim();
      const short = String((u?.short_name ?? u?.shortName ?? '')).trim();
      const fb = String((r.parent_short_name ?? '')).trim();
      const inner = name || fb || short;
      return inner ? `(${inner})` : '(—)';
    },
    packagingChildParen(r) {
      const u = this.unitOptions.find((x) => Number(x.id) === Number(r.child_unit_id));
      const short = String((u?.short_name ?? u?.shortName ?? '')).trim();
      const name = String((u?.name ?? '')).trim();
      const fb = String((r.child_short_name ?? '')).trim();
      const inner = short || fb || name;
      return inner ? `(${inner})` : '(—)';
    },
    packagingRelationSentence(r, quantityText) {
      return this.$t('unitPackagingRelationSentence', {
        parent: this.packagingParentParen(r),
        quantity: quantityText,
        child: this.packagingChildParen(r),
      });
    },
    formatRowQuantity(raw) {
      return formatQuantity(raw);
    },
    parseQuantityInput(raw) {
      const t = String(raw ?? '').trim().replace(/\s/g, '').replace(',', '.');
      if (t === '') {
        return null;
      }
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    },
    onAddQuantityInput(e) {
      this.addQuantity = e.target.value;
    },
    onEditQuantityInput(e) {
      this.editDraftQty = e.target.value;
    },
    createRow() {
      if (!this.canAdd || this.readOnly || !Number.isFinite(this.baseUid)) {
        return;
      }
      const q = this.parseQuantityInput(this.addQuantity);
      if (q === null || q <= 0) {
        return;
      }
      const row = this.addRole === 'parent'
        ? { parent_unit_id: this.baseUid, child_unit_id: this.addOtherUnitId, quantity: q }
        : { parent_unit_id: this.addOtherUnitId, child_unit_id: this.baseUid, quantity: q };
      const next = [...(Array.isArray(this.modelValue) ? this.modelValue : []), row];
      this.$emit('update:modelValue', next);
      this.addOtherUnitId = 0;
      this.addQuantity = '1';
    },
    startEdit(idx, r) {
      this.editingIndex = idx;
      const n = this.parseQuantityInput(String(r.quantity ?? ''));
      this.editDraftQty = n !== null ? String(n) : String(r.quantity ?? '').trim();
    },
    cancelEdit() {
      this.editingIndex = null;
    },
    saveEdit(idx) {
      const qty = this.parseQuantityInput(this.editDraftQty);
      if (qty === null || qty <= 0) {
        this.$store.dispatch('showNotification', {
          title: this.$t('error'),
          subtitle: this.$t('quantityMustBePositive'),
          isDanger: true,
        });
        return;
      }
      const next = (Array.isArray(this.modelValue) ? [...this.modelValue] : []).map((r, i) => {
        if (i !== idx) {
          return r;
        }
        return { ...r, quantity: qty };
      });
      this.$emit('update:modelValue', next);
      this.cancelEdit();
    },
    removeRow(idx) {
      if (!window.confirm(this.$t('confirmDelete'))) {
        return;
      }
      const list = Array.isArray(this.modelValue) ? [...this.modelValue] : [];
      list.splice(idx, 1);
      this.$emit('update:modelValue', list);
      this.cancelEdit();
    },
  },
};
</script>
