<template>
  <div v-if="showProjectFilters">
    <label class="filters-modal-label">{{ $t('project') }}</label>
    <select :value="projectFilter" class="w-full" @input="$emit('update:projectFilter', $event.target.value)">
      <option value="">
        {{ $t('allProjects') }}
      </option>
      <option v-for="project in projects" :key="project.id" :value="project.id">
        {{ project.name }}
      </option>
    </select>
  </div>
  <div v-if="showProjectFilters">
    <label class="filters-modal-label">{{ $t('projectStatus') }}</label>
    <select :value="projectStatusFilter" class="w-full" @input="$emit('update:projectStatusFilter', $event.target.value)">
      <option value="">
        {{ $t('allStatuses') }}
      </option>
      <option v-for="status in projectStatuses" :key="status.id" :value="status.id">
        {{ translateProjectStatus(status.name, $t) }}
      </option>
    </select>
  </div>
  <div>
    <label class="filters-modal-label">{{ $t('payment') }}</label>
    <select :value="paymentStatusFilter" class="w-full" @input="$emit('update:paymentStatusFilter', $event.target.value)">
      <option value="">
        {{ $t('allStatuses') }}
      </option>
      <option value="unpaid">
        {{ $t('notPaid') }}
      </option>
      <option value="partially_paid">
        {{ $t('partiallyPaid') }}
      </option>
      <option value="paid">
        {{ $t('paid') }}
      </option>
    </select>
  </div>
  <div>
    <label class="filters-modal-label">{{ $t('contractFormat') }}</label>
    <select :value="lifecycleStatusFilter" class="w-full" @input="$emit('update:lifecycleStatusFilter', $event.target.value)">
      <option value="">
        {{ $t('allStatuses') }}
      </option>
      <option value="draft">
        {{ $t('contractStatusDraft') }}
      </option>
      <option value="active">
        {{ $t('contractStatusActive') }}
      </option>
    </select>
  </div>
  <div>
    <label class="filters-modal-label">{{ $t('contractSignature') }}</label>
    <select :value="contractStatusFilter" class="w-full" @input="$emit('update:contractStatusFilter', $event.target.value)">
      <option value="">
        {{ $t('allStatuses') }}
      </option>
      <option value="1">
        {{ $t('returned') }}
      </option>
      <option value="0">
        {{ $t('notReturned') }}
      </option>
    </select>
  </div>
  <div>
    <label class="filters-modal-label">{{ $t('cashRegister') }}</label>
    <select :value="cashRegisterFilter" class="w-full" @input="$emit('update:cashRegisterFilter', $event.target.value)">
      <option value="">
        {{ $t('allCashRegisters') }}
      </option>
      <option v-for="cashRegister in cashRegisters" :key="cashRegister.id" :value="cashRegister.id">
        {{ cashRegisterOptionLabel(cashRegister) }}
      </option>
    </select>
  </div>
  <div>
    <label class="filters-modal-label">{{ $t('contractType') }}</label>
    <select :value="typeFilter" class="w-full" @input="$emit('update:typeFilter', coerceTypeFilter($event.target.value))">
      <option value="">
        {{ $t('allTypes') }}
      </option>
      <option :value="0">
        {{ $t('cashless') }}
      </option>
      <option :value="1">
        {{ $t('cash') }}
      </option>
    </select>
  </div>
</template>

<script>
import { translateProjectStatus } from '@/utils/translationUtils';
import { formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';

export default {
  name: 'ProjectContractsFilterFields',
  props: {
    showProjectFilters: { type: Boolean, default: true },
    projectFilter: { type: [String, Number], default: '' },
    projectStatusFilter: { type: [String, Number], default: '' },
    paymentStatusFilter: { type: String, default: '' },
    lifecycleStatusFilter: { type: String, default: '' },
    contractStatusFilter: { type: String, default: '' },
    cashRegisterFilter: { type: [String, Number], default: '' },
    typeFilter: { type: [String, Number], default: '' },
    projects: { type: Array, default: () => [] },
    projectStatuses: { type: Array, default: () => [] },
    cashRegisters: { type: Array, default: () => [] },
    cashRegisterOptionLabel: { type: Function, required: true },
  },
  emits: [
    'update:projectFilter',
    'update:projectStatusFilter',
    'update:paymentStatusFilter',
    'update:lifecycleStatusFilter',
    'update:contractStatusFilter',
    'update:cashRegisterFilter',
    'update:typeFilter',
  ],
  methods: {
    translateProjectStatus,
    coerceTypeFilter(value) {
      if (value === '') {
        return '';
      }
      return Number(value);
    },
  },
};
</script>
