import {
  readLegacyCardGridColumns,
  removeLegacyCardGridColumns,
} from '@/utils/cardGridUtils';
import { storageCompanySegment } from '@/utils/browserLocalStorageUi';

export default {
  data() {
    return {
      cardFields: [],
    };
  },
  mounted() {
    this.loadCardFields();
    this.migrateLegacyCardGridColumns();
  },
  watch: {
    '$store.state.currentCompany.id'() {
      this.loadCardFields();
      this.migrateLegacyCardGridColumns();
    },
  },
  methods: {
    cardFieldsStorageKey() {
      return this.$storageUi.cardFieldsStorageKey(
        this.cardFieldsKey,
        this.$store.state.currentCompany?.id
      );
    },
    migrateLegacyCardGridColumns() {
      const companyId = this.$store.state.currentCompany?.id;
      const key = storageCompanySegment(companyId);
      if (this.$store.state.cardGridColumns?.[key] != null) {
        return;
      }
      const legacy = readLegacyCardGridColumns(companyId);
      if (legacy == null) {
        return;
      }
      this.$store.dispatch('setCardGridColumns', { companyId, columns: legacy });
      removeLegacyCardGridColumns(companyId);
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
            const defaultVisible = f.visible !== undefined && !f.visible?.call ? f.visible : true;
            return {
              ...f,
              visible: stored !== undefined ? stored : defaultVisible,
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
    toggleCardFieldVisible(fieldName) {
      const index = this.cardFields.findIndex((f) => f.name === fieldName);
      if (index < 0) return;
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
      this.$store.dispatch('resetCardGridColumns', this.$store.state.currentCompany?.id);
    },
  },
};
