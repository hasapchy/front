import { onKeyStroke } from '@vueuse/core';

export default {
    mounted() {
        this._keyboardStopFns = [];
        if (typeof this.handleEscapeKey === 'function') {
            const stop = onKeyStroke('Escape', (e) => {
                if (typeof this.handleEscapeKey === 'function') {
                    this.handleEscapeKey(e);
                }
            });
            this._keyboardStopFns.push(stop);
        }
        if (typeof this.handleSaveShortcut === 'function') {
            const stop = onKeyStroke(['s'], (e) => {
                if ((e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (typeof this.handleSaveShortcut === 'function') {
                        this.handleSaveShortcut(e);
                    }
                }
            });
            this._keyboardStopFns.push(stop);
        }
    },
    beforeUnmount() {
        (this._keyboardStopFns || []).forEach((fn) => fn());
    }
};
