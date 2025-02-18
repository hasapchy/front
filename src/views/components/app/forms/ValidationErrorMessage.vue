<template>
    <transition name="v-err-msg">
        <p v-if="show" class="text-red-500 text-xs italic mt-2"><span v-for="(e, i) in messages" :key="i">
            {{ e.$message }} <br>
        </span></p>
    </transition>
</template>

<script>
export default {
    props: {
        show: {
            type: Boolean,
            required: true
        },
        messages: {
            type: Array,
            required: true
        }
    }
}
</script>


<style>
.v-err-msg-enter-active, .v-err-msg-leave-active {
    transition: all 0.05s ease-in-out;
}
.v-err-msg-enter-from, .v-err-msg-leave-to{
    opacity: 0;
    transform: translateX(20px);
    font-size: 0;
}
.v-err-msg-enter-to, .v-err-msg-leave-from {
    opacity: 1;
    font-size: auto;
}
</style>