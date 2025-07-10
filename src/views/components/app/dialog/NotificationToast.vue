<template>
    <transition name="fade">
        <div v-if="show"
            :class="['fixed top-4 right-4 p-4 rounded shadow-lg', isDanger ? 'bg-[#EE4F47] text-white' : 'bg-[#5CB85C] text-white', 'z-100']">
            <h3 class="font-bold text-sm">{{ title }}</h3>
            <ul v-if="Array.isArray(subtitle)">
                <li v-for="(err, i) in subtitle" :key="i" class="text-sm">{{ err }}</li>
            </ul>
            <p v-else class="text-sm">{{ subtitle }}</p>
        </div>
    </transition>
</template>


<script>
export default {
    name: 'NotificationToast',
    props: {
        title: {
            type: String,
            required: true
        },
        subtitle: {
            type: String,
            required: true
        },
        isDanger: {
            type: Boolean,
            default: false
        },
        show: {
            type: Boolean,
            default: false
        }
    }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to

/* .fade-leave-active in <2.1.8 */
    {
    opacity: 0;
}
</style>