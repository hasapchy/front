import { onKeyStroke } from '@vueuse/core';

export default {
    mounted() {
        this._keyboardStopFns = [];
        if (this.handleEscapeKey) {
            const stop = onKeyStroke('Escape', (e) => {
                this.handleEscapeKey?.(e);
            });
            this._keyboardStopFns.push(stop);
        }
        if (this.handleSaveShortcut) {
            const stop = onKeyStroke(['s'], (e) => {
                if ((e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.handleSaveShortcut?.(e);
                }
            });
            this._keyboardStopFns.push(stop);
        }
    },
    beforeUnmount() {
        (this._keyboardStopFns || []).forEach((fn) => fn());
    }
};
