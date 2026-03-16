<template>
    <div class="flex items-start">
        <div class="flex flex-col items-start flex-shrink-0">
            <ClientIconsCell :client="client" />
            <div v-if="displayPosition" class="text-xs text-gray-500 mt-0.5">{{ displayPosition }}</div>
        </div>
        <div class="min-w-0">
            <span v-html="highlightedName"></span>
        </div>
    </div>
</template>

<script>
import ClientIconsCell from './ClientIconsCell.vue';
import { highlightMatches } from '@/utils/searchUtils';
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';

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
            return getClientDisplayName(this.client);
        },
        displayPosition() {
            return getClientDisplayPosition(this.client);
        },
        highlightedName() {
            return this.searchQuery && this.searchQuery.trim()
                ? highlightMatches(this.name, this.searchQuery)
                : this.name;
        }
    }
}
</script>
