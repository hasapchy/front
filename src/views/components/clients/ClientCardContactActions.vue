<template>
  <div
    class="entity-card__contact-actions"
    :class="{ 'entity-card__contact-actions--footer': inFooter }"
  >
    <button
      type="button"
      class="entity-card__contact-action"
      :class="{ 'entity-card__contact-action--disabled': !hasPhones }"
      :disabled="!hasPhones"
      :title="$t('phone')"
      :aria-label="$t('phone')"
      @click="handlePhoneClick"
    >
      <i
        :class="iconClass('fa-phone')"
        aria-hidden="true"
      />
    </button>
    <button
      type="button"
      class="entity-card__contact-action"
      :class="{ 'entity-card__contact-action--disabled': !hasEmails }"
      :disabled="!hasEmails"
      :title="$t('email')"
      :aria-label="$t('email')"
      @click="handleEmailClick"
    >
      <i
        :class="iconClass('fa-envelope')"
        aria-hidden="true"
      />
    </button>
    <ContactListPickerDialog
      :open="pickerOpen"
      :title="pickerTitle"
      :options="pickerOptions"
      @close="pickerOpen = false"
    />
  </div>
</template>

<script>
import ContactListPickerDialog from '@/views/components/clients/ContactListPickerDialog.vue';
import { formatPhoneForDisplay, toMailtoHref, toTelHref } from '@/utils/phoneEmailFormUtils';

export default {
    name: 'ClientCardContactActions',
    components: { ContactListPickerDialog },
    props: {
        client: {
            type: Object,
            required: true,
        },
        inFooter: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            pickerOpen: false,
            pickerTitle: '',
            pickerOptions: [],
        };
    },
    computed: {
        phoneValues() {
            return (this.client?.phones || [])
                .map((entry) => (entry && typeof entry.phone === 'string' ? entry.phone.trim() : ''))
                .filter(Boolean);
        },
        emailValues() {
            return (this.client?.emails || [])
                .map((entry) => (entry && typeof entry.email === 'string' ? entry.email.trim() : ''))
                .filter(Boolean);
        },
        hasPhones() {
            return this.phoneValues.length > 0;
        },
        hasEmails() {
            return this.emailValues.length > 0;
        },
    },
    methods: {
        iconClass(icon) {
            const size = this.inFooter ? 'text-[0.75rem]' : 'text-[0.5625rem]';
            return `fas ${icon} leading-none ${size}`;
        },
        openHref(href) {
            if (!href) {
                return;
            }
            window.location.href = href;
        },
        openPicker(title, values, icon, toHref) {
            const options = values
                .map((value) => {
                    const href = toHref(value);
                    if (!href) {
                        return null;
                    }
                    return {
                        href,
                        label: icon === 'fas fa-phone' ? formatPhoneForDisplay(value) : value,
                        icon,
                    };
                })
                .filter(Boolean);
            if (options.length === 1) {
                this.openHref(options[0].href);
                return;
            }
            this.pickerTitle = title;
            this.pickerOptions = options;
            this.pickerOpen = true;
        },
        handlePhoneClick() {
            if (!this.hasPhones) {
                return;
            }
            this.openPicker(this.$t('phoneNumber'), this.phoneValues, 'fas fa-phone', toTelHref);
        },
        handleEmailClick() {
            if (!this.hasEmails) {
                return;
            }
            this.openPicker(this.$t('email'), this.emailValues, 'fas fa-envelope', toMailtoHref);
        },
    },
};
</script>
