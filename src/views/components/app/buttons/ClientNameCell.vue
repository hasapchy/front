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
            if (!this.client) return '';
            if (typeof this.client.fullName === 'function') {
                return this.client.fullName();
            }
            return this.client.firstName || '';
        },
        highlightedName() {
            return this.searchQuery && this.searchQuery.trim()
                ? highlightMatches(this.name, this.searchQuery)
                : this.name;
        }
    }
}
</script>

