import { normalizeDateDisplayMode } from '@/utils/dateUtils';

export default {
    methods: {
        isDateColumn(column) {
            return column?.type === 'date' || column?.type === 'datetime';
        },
        resolveColumnDateMode(column) {
            return normalizeDateDisplayMode(column?.type, column?.dateDisplayMode);
        },
        dateColumnsForSettings(columns) {
            if (!Array.isArray(columns)) {
                return [];
            }
            return columns
                .map((column, index) => ({ column, index }))
                .filter(({ column }) => column.name !== 'select' && this.isDateColumn(column));
        },
        setColumnDateDisplayMode(columns, index, mode) {
            const column = columns?.[index];
            if (!this.isDateColumn(column)) {
                return;
            }
            column.dateDisplayMode = normalizeDateDisplayMode(column.type, mode);
            this.$forceUpdate();
            const persistKey = this.tableColumnsPersistKey;
            if (!persistKey) {
                return;
            }
            this.$nextTick(() => {
                localStorage.setItem(
                    this.$storageUi.tableColumnsStorageKey(persistKey, this.$store.state.currentCompany?.id),
                    JSON.stringify(columns.map((col) => {
                        const copy = { ...col };
                        delete copy.component;
                        delete copy.props;
                        return copy;
                    }))
                );
            });
        },
    },
};
