<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-600 dark:text-[var(--text-secondary)]">
      {{ $t('unitConversionsIntro') }}
    </p>
    <p
      v-if="readOnly"
      class="text-sm text-gray-600 dark:text-[var(--text-secondary)]"
    >
      {{ $t('unitPackagingReadonly') }}
    </p>
    <p
      v-else-if="!unitId"
      class="text-sm text-amber-700 dark:text-amber-400"
    >
      {{ $t('unitPackagingAfterSave') }}
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
              {{ o.shortName }} ({{ o.name }})
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
          :disabled="saving || !canAdd"
          :is-loading="saving"
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
                {{ $t('parentUnit') }}
              </th>
              <th class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]">
                {{ $t('childUnit') }}
              </th>
              <th class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]">
                {{ $t('quantity') }}
              </th>
              <th
                v-if="!readOnly"
                class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]"
              />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in filteredRows"
              :key="r.id"
            >
              <td class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]">
                {{ r.parentShortName }}
              </td>
              <td class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]">
                {{ r.childShortName }}
              </td>
              <td class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]">
                <template v-if="editingRowId === r.id && !readOnly">
                  <input
                    :value="editDraftQty"
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    class="w-28 rounded border border-gray-300 bg-[var(--input-bg)] p-1 dark:border-[var(--input-border)]"
                    @input="onEditQuantityInput"
                  >
                </template>
                <template v-else>
                  {{ formatRowQuantity(r.quantity) }}
                </template>
              </td>
              <td
                v-if="!readOnly"
                class="border border-gray-300 px-2 py-2 dark:border-[var(--border-subtle)]"
              >
                <template v-if="editingRowId === r.id">
                  <button
                    type="button"
                    class="mr-2 text-green-600 hover:underline"
                    :disabled="saving"
                    @click="saveRow(r)"
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
                    @click="startEdit(r)"
                  >
                    {{ $t('edit') }}
                  </button>
                  <button
                    type="button"
                    class="text-red-600 hover:underline"
                    @click="removeRow(r)"
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
import SettingsUnitsController from '@/api/SettingsUnitsController';
import { formatQuantity } from '@/utils/numberUtils';

export default {
  name: 'UnitPackagingTab',
  components: { PrimaryButton },
  props: {
    unitId: { type: Number, default: null },
    readOnly: { type: Boolean, default: false },
    unitOptions: { type: Array, required: true },
  },
  emits: ['changed'],
  data() {
    return {
      rows: [],
      saving: false,
      addRole: 'parent',
      addOtherUnitId: 0,
      addQuantity: '1',
      editingRowId: null,
      editDraftQty: '1',
    };
  },
  computed: {
    otherUnitOptions() {
      const uid = this.unitId == null ? NaN : Number(this.unitId);
      if (!Number.isFinite(uid)) {
        return this.unitOptions;
      }
      return this.unitOptions.filter((u) => Number(u.id) !== uid);
    },
    filteredRows() {
      const uid = this.unitId == null ? NaN : Number(this.unitId);
      if (!Number.isFinite(uid)) {
        return [];
      }
      return this.rows.filter(
        (r) => Number(r.parent_unit_id) === uid || Number(r.child_unit_id) === uid,
      );
    },
    canAdd() {
      const q = this.parseQuantityInput(this.addQuantity);
      return (
        this.addOtherUnitId > 0
        && q !== null
        && q > 0
      );
    },
  },
  watch: {
    unitId: {
      immediate: true,
      handler() {
        this.cancelEdit();
        void this.reload();
      },
    },
  },
  methods: {
    formatRowQuantity(raw) {
      return formatQuantity(raw);
    },
    mapRow(r) {
      const id = r.id != null ? Number(r.id) : r.id;
      return {
        id,
        parent_unit_id: r.parent_unit_id != null ? Number(r.parent_unit_id) : r.parent_unit_id,
        child_unit_id: r.child_unit_id != null ? Number(r.child_unit_id) : r.child_unit_id,
        quantity: r.quantity,
        parentShortName: r.parent_short_name,
        childShortName: r.child_short_name,
      };
    },
    parseQuantityInput(raw) {
      const t = String(raw ?? '').trim().replace(/\s/g, '').replace(',', '.');
      if (t === '') {
        return null;
      }
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    },
    formatQuantityDraftFromApi(raw) {
      const n = this.parseQuantityInput(String(raw ?? ''));
      if (n === null) {
        return String(raw ?? '').trim();
      }
      return String(n);
    },
    onAddQuantityInput(e) {
      this.addQuantity = e.target.value;
    },
    onEditQuantityInput(e) {
      this.editDraftQty = e.target.value;
    },
    formatApiError(e) {
      const d = e.response && e.response.data;
      if (!d) {
        return '';
      }
      if (d.errors) {
        return Object.values(d.errors).flat().join(' ');
      }
      return d.message || '';
    },
    async reload() {
      if (this.unitId == null || this.unitId === '') {
        this.rows = [];
        return;
      }
      try {
        const list = await SettingsUnitsController.listConversions();
        this.rows = Array.isArray(list) ? list.map((x) => this.mapRow(x)) : [];
      } catch (e) {
        this.$store.dispatch('showNotification', {
          title: this.$t('error'),
          subtitle: this.formatApiError(e),
          isDanger: true,
        });
      }
    },
    async createRow() {
      if (!this.canAdd || this.readOnly) {
        return;
      }
      const q = this.parseQuantityInput(this.addQuantity);
      if (q === null || q <= 0) {
        return;
      }
      const payload = this.addRole === 'parent'
        ? {
            parentUnitId: this.unitId,
            childUnitId: this.addOtherUnitId,
            quantity: q,
          }
        : {
            parentUnitId: this.addOtherUnitId,
            childUnitId: this.unitId,
            quantity: q,
          };
      this.saving = true;
      try {
        await SettingsUnitsController.createConversion(payload);
        this.addOtherUnitId = 0;
        this.addQuantity = '1';
        await this.reload();
        this.$emit('changed');
        this.$store.dispatch('showNotification', { title: this.$t('success') });
      } catch (e) {
        this.$store.dispatch('showNotification', {
          title: this.$t('error'),
          subtitle: this.formatApiError(e),
          isDanger: true,
        });
      } finally {
        this.saving = false;
      }
    },
    startEdit(r) {
      this.editingRowId = r.id != null ? Number(r.id) : r.id;
      this.editDraftQty = this.formatQuantityDraftFromApi(r.quantity);
    },
    cancelEdit() {
      this.editingRowId = null;
    },
    async saveRow(r) {
      const qty = this.parseQuantityInput(this.editDraftQty);
      if (qty === null || qty <= 0) {
        this.$store.dispatch('showNotification', {
          title: this.$t('error'),
          subtitle: this.$t('quantityMustBePositive'),
          isDanger: true,
        });
        return;
      }
      this.saving = true;
      try {
        await SettingsUnitsController.updateConversion(r.id, {
          parentUnitId: r.parent_unit_id,
          childUnitId: r.child_unit_id,
          quantity: qty,
        });
        this.cancelEdit();
        await this.reload();
        this.$emit('changed');
        this.$store.dispatch('showNotification', { title: this.$t('success') });
      } catch (e) {
        this.$store.dispatch('showNotification', {
          title: this.$t('error'),
          subtitle: this.formatApiError(e),
          isDanger: true,
        });
      } finally {
        this.saving = false;
      }
    },
    async removeRow(r) {
      if (!window.confirm(this.$t('confirmDelete'))) {
        return;
      }
      this.saving = true;
      try {
        await SettingsUnitsController.deleteConversion(r.id);
        this.cancelEdit();
        await this.reload();
        this.$emit('changed');
        this.$store.dispatch('showNotification', { title: this.$t('success') });
      } catch (e) {
        this.$store.dispatch('showNotification', {
          title: this.$t('error'),
          subtitle: this.formatApiError(e),
          isDanger: true,
        });
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
