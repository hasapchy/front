<template>
    <div class="border rounded-lg p-4 bg-white">
        <h3 class="text-md font-semibold mb-3">{{ label }}</h3>
        
        <div class="space-y-3">
            <!-- Количество знаков -->
            <div>
                <label class="block mb-1">{{ $t('decimalPlaces') }}:</label>
                <select :value="decimals" @change="$emit('update:decimals', parseInt($event.target.value))">
                    <option :value="2">2</option>
                    <option :value="3">3</option>
                    <option :value="4">4</option>
                    <option :value="5">5</option>
                </select>
            </div>

            <!-- Направление округления -->
            <div>
                <label class="block mb-1">{{ $t('roundingDirection') }}:</label>
                <select :value="direction" @change="$emit('update:direction', $event.target.value)">
                    <option value="standard">{{ $t('standardRounding') }}</option>
                    <option value="up">{{ $t('roundUp') }}</option>
                    <option value="down">{{ $t('roundDown') }}</option>
                    <option value="custom">{{ $t('customThreshold') }}</option>
                </select>
            </div>

            <!-- Кастомный порог (только для custom) -->
            <div v-if="direction === 'custom'">
                <label class="block mb-1">{{ $t('threshold') }} (0.0-1.0):</label>
                <input 
                    type="number" 
                    :value="customThreshold"
                    min="0" 
                    max="1" 
                    step="0.01"
                    @change="$emit('update:customThreshold', parseFloat($event.target.value))"
                >
                <div class="text-xs text-gray-500 mt-1">
                    {{ $t('customThresholdHint') }}
                </div>
            </div>

            <!-- Индикатор сохранено -->
            <div v-if="rule && rule.id" class="text-sm text-green-600">
                <i class="fas fa-check-circle"></i> {{ $t('saved') }}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'RoundingRuleSection',
    props: {
        context: String,
        label: String,
        rule: Object,
        decimals: Number,
        direction: String,
        customThreshold: Number
    },
    emits: ['update:decimals', 'update:direction', 'update:customThreshold']
};
</script>

