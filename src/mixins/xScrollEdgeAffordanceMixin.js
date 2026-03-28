export default {
    data() {
        return {
            xScrollContainerRef: 'xScrollContainer',
            canScrollLeft: false,
            canScrollRight: false,
            showXScrollArrows: false,
            affordanceVisible: false,
            xAffordanceLeftStyle: {},
            xAffordanceRightStyle: {},
            xScrollRaf: null,
            xScrollDirection: 0,
            xScrollLastTs: 0,
            xResizeObserver: null,
            affordancePositionRaf: null,
            boundXScrollOnResize: null,
            boundXScrollOnScroll: null,
        };
    },
    mounted() {
        this.$nextTick(() => {
            this.initXScrollAffordance();
            this.updateXScrollState();
            this.scheduleUpdateAffordancePosition();
        });
    },
    beforeUnmount() {
        this.stopAutoXScroll();
        if (this.xResizeObserver) {
            this.xResizeObserver.disconnect();
            this.xResizeObserver = null;
        }
        if (this.boundXScrollOnResize) {
            window.removeEventListener('resize', this.boundXScrollOnResize);
            this.boundXScrollOnResize = null;
        }
        if (this.boundXScrollOnScroll) {
            window.removeEventListener('scroll', this.boundXScrollOnScroll, true);
            this.boundXScrollOnScroll = null;
        }
        if (this.affordancePositionRaf) {
            cancelAnimationFrame(this.affordancePositionRaf);
            this.affordancePositionRaf = null;
        }
    },
    methods: {
        getXScrollEl() {
            return this.$refs[this.xScrollContainerRef];
        },
        initXScrollAffordance() {
            if (this.boundXScrollOnResize) return;
            const el = this.getXScrollEl();
            if (!el) return;

            this.boundXScrollOnResize = () => {
                this.updateXScrollState();
                this.scheduleUpdateAffordancePosition();
            };
            this.boundXScrollOnScroll = () => this.scheduleUpdateAffordancePosition();
            window.addEventListener('resize', this.boundXScrollOnResize, { passive: true });
            window.addEventListener('scroll', this.boundXScrollOnScroll, { passive: true, capture: true });

            if (typeof ResizeObserver !== 'undefined') {
                this.xResizeObserver = new ResizeObserver(() => {
                    this.updateXScrollState();
                    this.scheduleUpdateAffordancePosition();
                });
                this.xResizeObserver.observe(el);
            }
        },
        scheduleUpdateAffordancePosition() {
            if (this.affordancePositionRaf) return;
            this.affordancePositionRaf = requestAnimationFrame(() => {
                this.affordancePositionRaf = null;
                this.updateAffordancePosition();
            });
        },
        updateAffordancePosition() {
            const el = this.getXScrollEl();
            if (!el) {
                this.affordanceVisible = false;
                this.xAffordanceLeftStyle = {};
                this.xAffordanceRightStyle = {};
                return;
            }

            const r = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const vw = window.innerWidth;
            const bandW = 76;
            const chevron = 58;
            const half = chevron / 2;
            const pad = 8;

            const intersects = r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
            if (!intersects) {
                this.affordanceVisible = false;
                return;
            }

            this.affordanceVisible = true;

            let top = vh / 2;
            const minY = r.top + half + pad;
            const maxY = r.bottom - half - pad;
            if (maxY >= minY) {
                top = Math.min(Math.max(top, minY), maxY);
            } else {
                top = (r.top + r.bottom) / 2;
            }

            const leftEdge = Math.min(Math.max(0, r.left), vw - bandW);
            const rightLeft = Math.max(0, r.right - bandW);
            const rightClamped = Math.min(rightLeft, vw - bandW);

            this.xAffordanceLeftStyle = {
                position: 'fixed',
                top: `${top}px`,
                left: `${leftEdge}px`,
                transform: 'translateY(-50%)',
                width: `${bandW}px`,
                height: `${chevron}px`,
            };
            this.xAffordanceRightStyle = {
                position: 'fixed',
                top: `${top}px`,
                left: `${rightClamped}px`,
                transform: 'translateY(-50%)',
                width: `${bandW}px`,
                height: `${chevron}px`,
            };
        },
        updateXScrollState() {
            const el = this.getXScrollEl();
            if (!el) {
                this.showXScrollArrows = false;
                this.canScrollLeft = false;
                this.canScrollRight = false;
                return;
            }

            const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
            const sl = el.scrollLeft;
            const epsilon = 1;

            this.showXScrollArrows = maxScrollLeft > epsilon;
            this.canScrollLeft = sl > epsilon;
            this.canScrollRight = sl < (maxScrollLeft - epsilon);
        },
        startAutoXScroll(direction) {
            const el = this.getXScrollEl();
            if (!el) return;

            const dir = direction < 0 ? -1 : 1;
            if (this.xScrollDirection === dir && this.xScrollRaf) return;

            this.stopAutoXScroll();
            this.xScrollDirection = dir;
            this.xScrollLastTs = 0;

            const step = () => {
                const target = this.getXScrollEl();
                if (!target || !this.xScrollDirection) return;

                const reduceMotion = typeof window !== 'undefined' &&
                    window.matchMedia &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                const speedPxPerSecond = reduceMotion ? 0 : 520;

                const now = performance.now();
                const last = this.xScrollLastTs || now;
                const dtMs = Math.min(40, Math.max(0, now - last));
                this.xScrollLastTs = now;

                const dx = this.xScrollDirection * speedPxPerSecond * (dtMs / 1000);
                target.scrollLeft += dx;
                this.updateXScrollState();

                if (
                    (this.xScrollDirection < 0 && !this.canScrollLeft) ||
                    (this.xScrollDirection > 0 && !this.canScrollRight)
                ) {
                    this.stopAutoXScroll();
                    return;
                }

                this.xScrollRaf = window.requestAnimationFrame(step);
            };

            this.xScrollRaf = window.requestAnimationFrame(step);
        },
        stopAutoXScroll() {
            this.xScrollDirection = 0;
            this.xScrollLastTs = 0;
            if (this.xScrollRaf) {
                window.cancelAnimationFrame(this.xScrollRaf);
                this.xScrollRaf = null;
            }
        },
    },
};
