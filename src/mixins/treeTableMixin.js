const escapeHtml = (value) => {
  const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[<>&"']/g, (c) => map[c]);
};

const compareValues = (a, b) => {
  const aIsNum = typeof a === 'number' && !Number.isNaN(a);
  const bIsNum = typeof b === 'number' && !Number.isNaN(b);
  if (aIsNum && bIsNum) {
    return a - b;
  }
  return String(a ?? '').localeCompare(String(b ?? ''));
};

const hueFromId = (id) => {
  const str = String(id ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
};

export default {
  data() {
    return {
      treeExpandedIds: new Set(),
      treeSortKey: null,
      treeSortOrder: 1,
    };
  },
  computed: {
    treeSourceItems() {
      return [];
    },
    treeNodes() {
      const items = Array.isArray(this.treeSourceItems) ? this.treeSourceItems : [];
      if (items.length === 0) {
        return { roots: [], byId: new Map() };
      }
      const byId = new Map();
      items.forEach((item) => {
        if (item && item.id != null) {
          byId.set(item.id, { item, children: [], parent: null, level: 0 });
        }
      });
      const roots = [];
      byId.forEach((node) => {
        const parentId = node.item.parentId ?? null;
        const parent = parentId != null ? byId.get(parentId) : null;
        if (parent) {
          node.parent = parent;
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      });
      const compare = (a, b) => this.compareTreeNodes(a, b);
      const sortRecursive = (nodes) => {
        nodes.sort(compare);
        nodes.forEach((n) => sortRecursive(n.children));
      };
      sortRecursive(roots);
      return { roots, byId };
    },
    treeFlatNodes() {
      const flat = [];
      const { roots } = this.treeNodes;
      const dfs = (nodes, level, rootId) => {
        nodes.forEach((node) => {
          node.level = level;
          node.rootId = rootId ?? node.item.id;
          flat.push(node);
          dfs(node.children, level + 1, node.rootId);
        });
      };
      dfs(roots, 0, null);
      return flat;
    },
    treeMetaById() {
      const meta = new Map();
      const expanded = this.treeExpandedIds;
      this.treeFlatNodes.forEach((node) => {
        meta.set(node.item.id, {
          level: node.level,
          hasChildren: node.children.length > 0,
          expanded: expanded.has(node.item.id),
          rootId: node.rootId,
        });
      });
      return meta;
    },
    treeVisibleItems() {
      const expanded = this.treeExpandedIds;
      const visible = [];
      this.treeFlatNodes.forEach((node) => {
        let parent = node.parent;
        while (parent) {
          if (!expanded.has(parent.item.id)) {
            return;
          }
          parent = parent.parent;
        }
        visible.push(node.item);
      });
      return visible;
    },
    treeHasAnyExpandable() {
      return this.treeFlatNodes.some((node) => node.children.length > 0);
    },
    treeIsAllExpanded() {
      return this.treeFlatNodes
        .filter((node) => node.children.length > 0)
        .every((node) => this.treeExpandedIds.has(node.item.id));
    },
  },
  methods: {
    /**
     * Возвращает значение элемента для сортировки по указанной колонке.
     * Может быть переопределён страницей для нестандартных полей.
     *
     * @param {object} item
     * @param {string} key
     * @returns {*}
     */
    treeSortValue(item, key) {
      return item ? item[key] : '';
    },
    /**
     * Сравнивает два узла дерева внутри одного уровня.
     * По умолчанию узлы с потомками выводятся выше (folders-before-files),
     * при явной сортировке колонки приоритет отдаётся выбранному ключу.
     *
     * @param {object} a
     * @param {object} b
     * @returns {number}
     */
    compareTreeNodes(a, b) {
      if (this.treeSortKey) {
        const va = this.treeSortValue(a.item, this.treeSortKey);
        const vb = this.treeSortValue(b.item, this.treeSortKey);
        const cmp = compareValues(va, vb);
        if (cmp !== 0) {
          return cmp * this.treeSortOrder;
        }
      }
      const aHas = a.children.length > 0 ? 1 : 0;
      const bHas = b.children.length > 0 ? 1 : 0;
      if (aHas !== bHas) {
        return bHas - aHas;
      }
      const aName = String(a.item.name ?? '');
      const bName = String(b.item.name ?? '');
      return aName.localeCompare(bName);
    },
    /**
     * Обработчик события sortChange от DraggableTable в режиме external-sort.
     *
     * @param {{key: string|null, order: number}} payload
     * @returns {void}
     */
    onTreeSortChange({ key, order } = {}) {
      this.treeSortKey = key || null;
      this.treeSortOrder = order === 1 ? 1 : -1;
    },
    /**
     * Переключает состояние раскрытия узла дерева.
     *
     * @param {number|string} id
     * @returns {void}
     */
    toggleTreeExpand(id) {
      const next = new Set(this.treeExpandedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      this.treeExpandedIds = next;
    },
    /**
     * Раскрывает все узлы, имеющие потомков.
     *
     * @returns {void}
     */
    expandAllTree() {
      const ids = this.treeFlatNodes
        .filter((node) => node.children.length > 0)
        .map((node) => node.item.id);
      this.treeExpandedIds = new Set(ids);
    },
    /**
     * Сворачивает все узлы.
     *
     * @returns {void}
     */
    collapseAllTree() {
      this.treeExpandedIds = new Set();
    },
    /**
     * Обработчик клика по html-ячейке для переключения раскрытия узла.
     * Должен быть передан как :on-html-cell-click в DraggableTable.
     *
     * @param {object} item
     * @param {object} column
     * @param {{sourceType?: string, sourceId?: string}} data
     * @returns {void}
     */
    handleTreeCellClick(item, column, data) {
      if (data?.sourceType === 'tree-toggle') {
        this.toggleTreeExpand(item.id);
      }
    },
    /**
     * Возвращает HTML для ячейки с цветовой группой, отступом и шевроном раскрытия.
     *
     * @param {string} label
     * @param {object} item
     * @returns {string}
     */
    treeNameCellHtml(label, item) {
      const meta = this.treeMetaById.get(item.id) || { level: 0, hasChildren: false, expanded: false, rootId: item.id };
      const safeLabel = escapeHtml(label);
      const indent = (meta.level || 0) * 16;
      const hue = hueFromId(meta.rootId ?? item.id);
      const stripe = `<span class="tree-group-stripe" style="--group-hue:${hue};"></span>`;
      const chevron = meta.hasChildren
        ? `<span class="tree-row__chevron" data-source-type="tree-toggle" data-source-id="${item.id}"><i class="fas ${meta.expanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[10px]"></i></span>`
        : '<span class="tree-row__chevron-spacer"></span>';
      return `<span class="tree-cell">${stripe}<span class="tree-row" style="padding-left:${indent}px;">${chevron}<span class="tree-row__label">${safeLabel}</span></span></span>`;
    },
  },
};
