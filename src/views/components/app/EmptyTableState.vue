<template>
  <div class="empty-table-state">
    <div class="empty-table-state__fallback">
      <i class="fas fa-clipboard-list empty-table-state__icon" aria-hidden="true"></i>
    </div>
    <p v-if="message" class="empty-table-state__message">{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: 'EmptyTableState',
  props: {
    message: {
      type: String,
      default: null,
    },
  },
};
</script>

<style scoped>
.empty-table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  min-height: 40vh;
  width: 100%;
}

.empty-table-state__fallback {
  flex-shrink: 0;
}

.empty-table-state__icon {
  font-size: 3.5rem;
  color: #cbd5e1;
  animation: empty-float-down 3.2s ease-in-out infinite;
}

.empty-table-state__message {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
  animation: empty-shake 3.2s ease-in-out infinite;
}

@keyframes empty-float-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(20px); }
}

@keyframes empty-shake {
  0% { transform: translateX(0); }
  5% { transform: translateX(-1px); }
  10% { transform: translateX(1px); }
  15% { transform: translateX(-1px); }
  20% { transform: translateX(1px); }
  25% { transform: translateX(-0.5px); }
  30% { transform: translateX(0.5px); }
  35% { transform: translateX(-1px); }
  40% { transform: translateX(1px); }
  45% { transform: translateX(-0.5px); }
  50%, 100% { transform: translateX(0); }
}
</style>
