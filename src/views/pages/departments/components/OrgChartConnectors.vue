<template>
    <svg 
        class="org-chart-connectors" 
        :style="{ width: svgWidth + 'px', height: svgHeight + 'px' }"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g v-for="(line, index) in lines" :key="index">
            <path
                :d="line.path"
                :stroke="lineColor"
                :stroke-width="lineWidth"
                fill="none"
                :stroke-linecap="line.isStraight ? 'butt' : 'round'"
                :stroke-linejoin="line.isStraight ? 'miter' : 'round'"
                class="org-connector-line"
            />
        </g>
    </svg>
</template>

<script>
export default {
    name: 'OrgChartConnectors',
    props: {
        nodes: {
            type: Array,
            default: () => []
        },
        lineColor: {
            type: String,
            default: '#9ca3af'
        },
        lineWidth: {
            type: Number,
            default: 3
        }
    },
    data() {
        return {
            lines: [],
            svgWidth: 0,
            svgHeight: 0,
            observer: null,
            scrollTimeout: null
        };
    },
    mounted() {
        this.$nextTick(() => {
            this.calculateLines();
            this.setupResizeObserver();
            this.setupScrollListener();
        });
    },
    beforeUnmount() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.removeScrollListener();
        if (this.scrollTimeout) {
            cancelAnimationFrame(this.scrollTimeout);
        }
    },
    watch: {
        nodes: {
            handler() {
                this.$nextTick(() => {
                    this.calculateLines();
                });
            },
            deep: true
        }
    },
    methods: {
        setupResizeObserver() {
            if (typeof ResizeObserver !== 'undefined') {
                this.observer = new ResizeObserver(() => {
                    this.calculateLines();
                });
                const container = this.$el.parentElement;
                if (container) {
                    this.observer.observe(container);
                }
            }
        },
        
        setupScrollListener() {
            const container = this.$el?.parentElement;
            if (container) {
                container.addEventListener('scroll', this.handleScroll, { passive: true });
            }
        },
        
        removeScrollListener() {
            const container = this.$el?.parentElement;
            if (container) {
                container.removeEventListener('scroll', this.handleScroll);
            }
        },
        
        handleScroll() {
            // Используем requestAnimationFrame для оптимизации
            if (this.scrollTimeout) {
                cancelAnimationFrame(this.scrollTimeout);
            }
            this.scrollTimeout = requestAnimationFrame(() => {
                this.calculateLines();
            });
        },
        
        calculateLines() {
            this.lines = [];
            const container = this.$el.parentElement;
            if (!container) return;

            // Используем scrollWidth и scrollHeight для полного размера контента
            this.svgWidth = container.scrollWidth || container.offsetWidth;
            this.svgHeight = container.scrollHeight || container.offsetHeight;

            // Получаем позицию контейнера относительно viewport
            const containerRect = container.getBoundingClientRect();
            
            // Получаем позицию скролла
            const scrollLeft = container.scrollLeft || 0;
            const scrollTop = container.scrollTop || 0;

            // Найдём карточку компании
            const companyCard = container.querySelector('.company-card');
            if (companyCard) {
                const companyRect = companyCard.getBoundingClientRect();
                // Координаты относительно контейнера с учетом скролла
                const companyBottom = {
                    x: (companyRect.left - containerRect.left + scrollLeft) + companyRect.width / 2,
                    y: (companyRect.top - containerRect.top + scrollTop) + companyRect.height
                };

                // Найдём все департаменты первого уровня
                const rootNodes = container.querySelectorAll('.org-node-container[data-level="0"]');
                if (rootNodes.length > 0) {
                    const rootTops = Array.from(rootNodes).map(node => {
                        const card = node.querySelector('.node-card');
                        if (!card) return null;
                        const rect = card.getBoundingClientRect();
                        return {
                            x: (rect.left - containerRect.left + scrollLeft) + rect.width / 2,
                            y: (rect.top - containerRect.top + scrollTop),
                            element: node
                        };
                    }).filter(Boolean);

                    if (rootTops.length === 0) return;

                    // Рисуем линии от компании к департаментам первого уровня
                    if (rootTops.length === 1) {
                        const target = rootTops[0];
                        const x = companyBottom.x;
                        this.lines.push({
                            path: `M ${x} ${companyBottom.y} L ${x} ${target.y}`,
                            isStraight: true
                        });
                    } else {
                        // Множественные департаменты: вертикаль -> горизонталь -> вертикали
                        const verticalLength = 56; // Половина от mt-28, чтобы угол был выше и заметнее
                        const junctionY = companyBottom.y + verticalLength;
                        
                        // Вертикальная линия от компании до горизонтали
                        this.lines.push({
                            path: `M ${companyBottom.x} ${companyBottom.y} L ${companyBottom.x} ${junctionY}`
                        });

                        // Горизонтальная линия
                        const leftX = Math.min(...rootTops.map(t => t.x));
                        const rightX = Math.max(...rootTops.map(t => t.x));
                        this.lines.push({
                            path: `M ${leftX} ${junctionY} L ${rightX} ${junctionY}`
                        });

                        // Вертикальные линии к каждому департаменту
                        rootTops.forEach(target => {
                            this.lines.push({
                                path: `M ${target.x} ${junctionY} L ${target.x} ${target.y}`
                            });
                        });
                    }

                    // Рекурсивно рисуем линии для вложенных департаментов
                    rootTops.forEach(rootTop => {
                        this.drawNodeConnections(rootTop.element, containerRect, scrollLeft, scrollTop);
                    });
                }
            }
        },

        drawNodeConnections(nodeElement, containerRect, scrollLeft, scrollTop) {
            const nodeCard = nodeElement.querySelector('.node-card');
            if (!nodeCard) return;

            const nodeRect = nodeCard.getBoundingClientRect();
            const nodeBottom = {
                x: (nodeRect.left - containerRect.left + scrollLeft) + nodeRect.width / 2,
                y: (nodeRect.top - containerRect.top + scrollTop) + nodeRect.height
            };

            // Найдём дочерние узлы этого узла (обновлённый селектор для mt-28)
            const childrenContainer = nodeElement.querySelector('.org-node-container > .relative.flex.flex-col.items-center.mt-28');
            if (!childrenContainer) {
                // Это нормально, если у узла нет детей
                return;
            }

            // Найдём прямые дочерние .org-node-container внутри .mx-4
            const childrenWrapper = childrenContainer.querySelector(':scope > .relative.flex.items-start');
            if (!childrenWrapper) return;

            const childNodes = childrenWrapper.querySelectorAll(':scope > .mx-4 > .org-node-container');
            if (childNodes.length === 0) return;

            const childTops = Array.from(childNodes).map(child => {
                const childCard = child.querySelector('.node-card');
                if (!childCard) return null;
                const rect = childCard.getBoundingClientRect();
                return {
                    x: (rect.left - containerRect.left + scrollLeft) + rect.width / 2,
                    y: (rect.top - containerRect.top + scrollTop),
                    element: child
                };
            }).filter(Boolean);

            if (childTops.length === 0) return;

            if (childTops.length === 1) {
                // Одна прямая вертикальная линия - выравниваем X координаты для строгой вертикали
                const target = childTops[0];
                const x = nodeBottom.x; // Используем X координату родителя для строгой вертикали
                this.lines.push({
                    path: `M ${x} ${nodeBottom.y} L ${x} ${target.y}`,
                    isStraight: true
                });
            } else {
                // Множественные дети: вертикаль -> горизонталь -> вертикали
                const verticalLength = 56; // Половина от mt-28, чтобы угол был выше и заметнее
                const junctionY = nodeBottom.y + verticalLength;
                
                // Вертикальная линия от родителя до горизонтали
                this.lines.push({
                    path: `M ${nodeBottom.x} ${nodeBottom.y} L ${nodeBottom.x} ${junctionY}`
                });

                // Горизонтальная линия
                const leftX = Math.min(...childTops.map(t => t.x));
                const rightX = Math.max(...childTops.map(t => t.x));
                this.lines.push({
                    path: `M ${leftX} ${junctionY} L ${rightX} ${junctionY}`
                });

                // Вертикальные линии к каждому ребёнку
                childTops.forEach(target => {
                    this.lines.push({
                        path: `M ${target.x} ${junctionY} L ${target.x} ${target.y}`
                    });
                });
            }

            // Рекурсивно рисуем для детей
            childTops.forEach(childTop => {
                if (childTop.element) {
                    this.drawNodeConnections(childTop.element, containerRect, scrollLeft, scrollTop);
                }
            });
        }
    }
};
</script>

<style scoped>
.org-chart-connectors {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 0;
}

.org-connector-line {
    transition: stroke 0.2s ease;
}
</style>

