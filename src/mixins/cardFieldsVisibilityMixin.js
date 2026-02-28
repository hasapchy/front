export default {
    data() {
        return {
            cardFields: []
        };
    },
    mounted() {
        this.loadCardFields();
    },
    methods: {
        getCardFieldsStorageKey() {
            return `cardFields_${this.cardFieldsKey}`;
        },
        getCardFieldsLegacyStorageKey() {
            const companyId = this.$store.state.currentCompany?.id || 'default';
            return `cardFields_${this.cardFieldsKey}_${companyId}`;
        },
        getCardFieldsStorageItem(primaryKey, legacyKey) {
            const saved = localStorage.getItem(primaryKey);
            if (saved) return saved;
            const legacy = legacyKey ? localStorage.getItem(legacyKey) : null;
            if (!legacy) return null;
            localStorage.setItem(primaryKey, legacy);
            if (legacyKey) localStorage.removeItem(legacyKey);
            return legacy;
        },
        setCardFieldsStorageItem(primaryKey, legacyKey, value) {
            localStorage.setItem(primaryKey, value);
            if (legacyKey) localStorage.removeItem(legacyKey);
        },
        loadCardFields() {
            const base = this.cardConfigBase || [];
            const toggleableFields = base.filter(f => f.name && f.name !== (this.titleField || 'title'));
            const saved = this.getCardFieldsStorageItem(
                this.getCardFieldsStorageKey(),
                this.getCardFieldsLegacyStorageKey()
            );
            if (saved) {
                try {
                    const savedMap = JSON.parse(saved);
                    this.cardFields = toggleableFields.map(f => {
                        const stored = savedMap[f.name];
                        return {
                            ...f,
                            visible: stored !== undefined ? stored : true
                        };
                    });
                } catch (e) {
                    this.resetCardFields();
                }
            } else {
                this.cardFields = toggleableFields.map(f => ({
                    ...f,
                    visible: f.visible !== undefined && typeof f.visible !== 'function' ? f.visible : true
                }));
            }
        },
        saveCardFields() {
            const map = {};
            this.cardFields.forEach(f => { map[f.name] = f.visible; });
            this.setCardFieldsStorageItem(
                this.getCardFieldsStorageKey(),
                this.getCardFieldsLegacyStorageKey(),
                JSON.stringify(map)
            );
        },
        toggleCardFieldVisible(index) {
            if (index < 0 || index >= this.cardFields.length) return;
            this.cardFields[index].visible = !this.cardFields[index].visible;
            this.saveCardFields();
        },
        resetCardFields() {
            const base = this.cardConfigBase || [];
            const toggleableFields = base.filter(f => f.name && f.name !== (this.titleField || 'title'));
            this.cardFields = toggleableFields.map(f => ({
                ...f,
                visible: f.visible !== undefined && typeof f.visible !== 'function' ? f.visible : true
            }));
            this.saveCardFields();
        }
    }
};
