<template>
  <UserButtonCell
    :user="user"
    :search-query="searchQuery"
    display-field="id"
  />
</template>

<script>
import UserButtonCell from '@/views/components/app/buttons/UserButtonCell.vue';

export default {
    name: 'UserIdCell',
    components: {
        UserButtonCell,
    },
    props: {
        user: {
            type: Object,
            required: true
        },
        searchQuery: {
            type: String,
            default: ''
        }
    }
};
</script>
