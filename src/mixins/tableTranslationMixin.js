export default {
    computed: {
        translatedColumnsConfig() {
            return this.columnsConfig.map(column => ({
                ...column,
                label: column.label === '#' || column.label === '№' || column.label === 'ID' ? column.label : this.$t(column.label)
            }));
        }
    }
};
