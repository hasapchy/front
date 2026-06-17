<template>
  <button
    type="button"
    class="chat-entity-link-card"
    :class="{
      'chat-entity-link-card--loading': loading,
      'chat-entity-link-card--error': loadFailed,
    }"
    :disabled="isClickDisabled"
    @click="handleClick"
  >
    <div class="chat-entity-link-card__icon">
      <i :class="iconClass" />
    </div>
    <div class="chat-entity-link-card__content min-w-0">
      <div class="chat-entity-link-card__title truncate">
        {{ displayTitle }}
      </div>
      <div
        v-if="displaySubtitle"
        class="chat-entity-link-card__subtitle truncate"
      >
        {{ displaySubtitle }}
      </div>
    </div>
    <i
      v-if="!loadFailed"
      class="fas fa-chevron-right chat-entity-link-card__arrow"
    />
  </button>
</template>

<script>
import EntityLinkController from '@/api/EntityLinkController';
import { getEntityShareConfig } from '@/constants/entityShareRegistry';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

export default {
  mixins: [getApiErrorMessageMixin],
  props: {
    entity: {
      type: String,
      default: '',
    },
    entityId: {
      type: [Number, String],
      default: null,
    },
    url: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    subtitle: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    lazy: {
      type: Boolean,
      default: false,
    },
    verifyAccess: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      preview: null,
      loadFailed: false,
      loadError: '',
    };
  },
  computed: {
    iconClass() {
      if (this.loadFailed) {
        return 'fas fa-lock';
      }
      return this.preview?.icon || this.icon || getEntityShareConfig(this.entity)?.icon || 'fas fa-link';
    },
    displayTitle() {
      if (this.loading) {
        return '...';
      }
      if (this.loadFailed) {
        return this.loadError || this.$t('entityShareNoAccess');
      }
      if (this.preview?.title) {
        return this.preview.title;
      }
      if (!this.verifyAccess && this.title) {
        return this.title;
      }
      if (this.entity && this.entityId) {
        return this.$t('entityLinkTransaction', { id: this.entityId });
      }
      return this.url;
    },
    displaySubtitle() {
      if (this.loading || this.loadFailed) {
        return '';
      }
      if (this.preview?.subtitle) {
        return this.preview.subtitle;
      }
      if (!this.verifyAccess) {
        return this.subtitle || '';
      }
      return '';
    },
    targetUrl() {
      if (this.verifyAccess && !this.preview) {
        return '';
      }
      return this.preview?.url || this.url || '';
    },
    isClickDisabled() {
      if (this.loading) {
        return true;
      }
      if (this.verifyAccess) {
        return this.loadFailed || !this.preview;
      }
      return this.loadFailed && !this.targetUrl;
    },
  },
  mounted() {
    if (this.entity && this.entityId && (this.verifyAccess || (this.lazy && !this.title))) {
      this.loadPreview();
    }
  },
  methods: {
    async loadPreview() {
      if (this.loading || this.preview || this.loadFailed) {
        return;
      }
      this.loading = true;
      try {
        this.preview = await EntityLinkController.getPreview({
          entity: this.entity,
          entityId: this.entityId,
        });
      } catch (e) {
        this.loadFailed = true;
        this.loadError = this.getApiErrorMessage(e);
      } finally {
        this.loading = false;
      }
    },
    handleClick() {
      if (this.isClickDisabled) {
        return;
      }
      const path = this.targetUrl;
      if (!path) {
        return;
      }
      if (path.startsWith('http')) {
        const url = new URL(path);
        this.$router.push(url.pathname);
        return;
      }
      this.$router.push(path);
    },
  },
};
</script>

<style scoped>
.chat-entity-link-card {
  display: flex;
  width: 100%;
  max-width: 320px;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.375rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--nav-accent);
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--nav-accent) 6%, var(--surface-elevated));
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.chat-entity-link-card:hover:not(:disabled) {
  background: color-mix(in srgb, var(--nav-accent) 12%, var(--surface-elevated));
}

.chat-entity-link-card--loading {
  opacity: 0.75;
}

.chat-entity-link-card--error {
  border-left-color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 8%, var(--surface-elevated));
  cursor: default;
}

.chat-entity-link-card__icon {
  display: flex;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--nav-accent) 16%, var(--surface-muted));
  color: var(--nav-accent);
}

.chat-entity-link-card--error .chat-entity-link-card__icon {
  background: color-mix(in srgb, var(--color-danger) 16%, var(--surface-muted));
  color: var(--color-danger);
}

.chat-entity-link-card__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.chat-entity-link-card__subtitle {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.chat-entity-link-card__arrow {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 0.625rem;
  color: var(--text-secondary);
}
</style>
