<template>
    <div class="mt-4">
        <div v-if="clientCheckLoading" key="loader" class="min-h-64">
            <TableSkeleton />
        </div>
        <div v-else-if="!employeeClient" class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-center gap-2">
                <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                <div class="flex-1">
                    <p class="text-sm text-yellow-800 font-semibold">{{ $t('employeeClientNotFound') }}</p>
                    <p class="text-xs text-yellow-700 mt-1">{{ $t('employeeClientNotFoundDescription') }}</p>
                </div>
            </div>
        </div>
        <ClientBalancesTab v-else :editing-item="employeeClient" @balance-updated="findEmployeeClient" />
    </div>
</template>

<script>
import ClientController from '@/api/ClientController';
import ClientBalancesTab from '@/views/pages/clients/ClientBalancesTab.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';

export default {
    name: 'UserAccountTab',
    components: { ClientBalancesTab, TableSkeleton },
    props: {
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            employeeClient: null,
            clientCheckLoading: false,
        };
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.findEmployeeClient();
                } else {
                    this.employeeClient = null;
                }
            },
            immediate: true,
        },
    },
    methods: {
        async findEmployeeClient() {
            if (!this.editingItem || !this.editingItem.id) {
                this.employeeClient = null;
                this.clientCheckLoading = false;
                return;
            }

            this.clientCheckLoading = true;
            try {
                const companyId = this.$store.getters.currentCompanyId;
                if (!companyId) {
                    this.employeeClient = null;
                    this.clientCheckLoading = false;
                    return;
                }

                const userId = Number(this.editingItem.id);
                await this.$store.dispatch('loadClients');
                const clients = this.$store.getters.clients || [];
                const client = clients.find(c => {
                    const clientEmployeeId = c.employeeId ? Number(c.employeeId) : null;
                    return clientEmployeeId === userId;
                });
                if (client?.id) {
                    const fullClient = await ClientController.getItem(client.id);
                    this.employeeClient = fullClient || client;
                } else {
                    this.employeeClient = null;
                }
            } catch (error) {
                console.error('Error finding employee client:', error);
                this.employeeClient = null;
            } finally {
                this.clientCheckLoading = false;
            }
        },
    },
};
</script>
