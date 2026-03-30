export default {
  data() {
    return {
      cardFields: [],
    };
  },
  mounted() {
    this.loadCardFields();
  },
  watch: {
    '$store.state.currentCompany.id'() {
      this.loadCardFields();
    },
  },
  methods: {
    cardFieldsStorageKey() {
      return this.$storageUi.cardFieldsStorageKey(
        this.cardFieldsKey,
        this.$store.state.currentCompany?.id
      );
    },
    loadCardFields() {
      const base = this.cardConfigBase || [];
      const toggleableFields = base.filter(
        (f) => f.name && f.name !== (this.titleField || 'title')
      );
      const saved = localStorage.getItem(this.cardFieldsStorageKey());
      if (saved) {
        try {
          const savedMap = JSON.parse(saved);
          this.cardFields = toggleableFields.map((f) => {
            const stored = savedMap[f.name];
            return {
              ...f,
              visible: stored !== undefined ? stored : true,
            };
          });
        } catch {
          this.resetCardFields();
        }
      } else {
        this.cardFields = toggleableFields.map((f) => ({
          ...f,
          visible:
            f.visible !== undefined && !f.visible?.call ? f.visible : true,
        }));
      }
    },
    saveCardFields() {
      const map = {};
      this.cardFields.forEach((f) => {
        map[f.name] = f.visible;
      });
      localStorage.setItem(
        this.cardFieldsStorageKey(),
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
      const toggleableFields = base.filter(
        (f) => f.name && f.name !== (this.titleField || 'title')
      );
      this.cardFields = toggleableFields.map((f) => ({
        ...f,
        visible:
          f.visible !== undefined && !f.visible?.call ? f.visible : true,
      }));
      this.saveCardFields();
    },
  },
};
