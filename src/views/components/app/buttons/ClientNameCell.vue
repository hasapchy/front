<template>
    <div class="flex items-center">
        <ClientIconsCell :client="client" />
        <span v-html="highlightedName"></span>
    </div>
</template>

<script>
import ClientIconsCell from './ClientIconsCell.vue';
import { highlightMatches } from '@/utils/searchUtils';

export default {
    name: 'ClientNameCell',
    components: {
        ClientIconsCell
    },
    props: {
        client: {
            type: Object,
            required: true
        },
        searchQuery: {
            type: String,
            default: ''
        }
    },
    computed: {
        name() {
            const parts = [];
            if (this.client.firstName) parts.push(this.client.firstName);
            if (this.client.lastName) parts.push(this.client.lastName);
            let name = parts.join(' ');
            if (this.client.contactPerson) {
                name += ` (${this.client.contactPerson})`;
            }
            return name.trim();
        },
        highlightedName() {
            return this.searchQuery && this.searchQuery.trim()
                ? highlightMatches(this.name, this.searchQuery)
                : this.name;
        }
    }
}
</script>

