<template>
  <div
    class="flex flex-wrap items-center gap-1.5"
    :class="isMyMessage ? 'justify-end' : 'justify-start'"
  >
    <button
      v-for="r in reactionRows"
      :key="r.emoji"
      type="button"
      class="flex items-center gap-0.5 px-2 py-0.5 rounded-[12px] text-sm transition-colors duration-150 min-h-[24px] justify-center"
      :class="[
        isReactedByCurrentUser(r)
          ? 'bg-[#e8f4fd] text-[#2a9ef6]'
          : 'bg-[#f0f0f0] hover:bg-[#e5e5e5] text-gray-700',
        isMyMessage ? 'justify-end' : 'justify-start'
      ]"
      :title="getReactionTooltip(r) + (isReactedByCurrentUser(r) ? ' (клик — снять)' : '')"
      @click="onReactionClick(r)"
    >
      <span class="text-[15px] leading-none select-none">{{ r.emoji }}</span>
      <span v-if="r.count > 1" class="text-[11px] font-medium opacity-90">{{ r.count }}</span>
    </button>

    <button
      v-if="showAddButton"
      type="button"
      class="flex items-center justify-center w-6 h-6 rounded-[12px] bg-[#f0f0f0] hover:bg-[#e5e5e5] transition-colors text-gray-500"
      title="Добавить реакцию"
      aria-label="Добавить реакцию"
      @click.stop="$emit('open-picker', { messageId, position: isMyMessage ? 'right' : 'left' })"
    >
      <span class="text-sm font-light leading-none">+</span>
    </button>
  </div>
</template>

<script>
/** Реакции под сообщением в стиле Telegram: клик переключает, + открывает пикер. */
export default {
  name: 'MessageReactions',
  props: {
    reactions: { type: Array, default: () => [] },
    messageId: { type: [Number, String], required: true },
    isMyMessage: { type: Boolean, default: false },
    currentUserId: { type: [Number, String], default: null },
    showAddButton: { type: Boolean, default: true }
  },
  emits: ['reaction-toggle', 'open-picker'],
  computed: {
    reactionRows() {
      const list = this.reactions || []
      if (!list.length) return []
      const myId = this.currentUserId ? Number(this.currentUserId) : null
      const byEmoji = {}
      list.forEach((r) => {
        const e = r.emoji || ''
        if (!e) return
        if (!byEmoji[e]) {
          byEmoji[e] = { emoji: e, count: 0, users: [], isMyReaction: false }
        }
        byEmoji[e].count += 1
        if (r.user && (r.user.name || r.user_id)) {
          byEmoji[e].users.push({
            id: r.user_id,
            name: r.user?.name ? `${r.user.name} ${r.user.surname || ''}`.trim() : `#${r.user_id}`
          })
        }
        if (myId && Number(r.user_id) === myId) byEmoji[e].isMyReaction = true
      })
      return Object.values(byEmoji)
    }
  },
  methods: {
    isReactedByCurrentUser(r) {
      return r.isMyReaction
    },
    /** Клик по реакции: чужая — добавить свою; своя — снять с сообщения. */
    onReactionClick(r) {
      this.$emit('reaction-toggle', r.emoji)
    },
    getReactionTooltip(r) {
      if (!r.users || !r.users.length) return `${r.emoji} ${r.count}`
      const names = r.users.map((u) => u.name || `#${u.id}`).join(', ')
      return `${r.emoji} ${r.count}: ${names}`
    }
  }
}
</script>
