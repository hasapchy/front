export default {
    methods: {
        fieldConfig(name) {
            const baseConfig = {
                visible: true,
                readonly: false,
                required: false,
                enforcedValue: undefined,
            };
            const overrides = this.formConfig?.[name];
            return overrides ? { ...baseConfig, ...overrides } : baseConfig;
        },
        isFieldRequired(name) {
            return !!this.fieldConfig(name).required;
        },
        isFieldVisible(name) {
            return this.fieldConfig(name).visible !== false;
        },
    }
}

