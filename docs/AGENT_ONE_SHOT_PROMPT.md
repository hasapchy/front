# One-Shot Prompt: New Module

Use this prompt as-is (replace placeholders only).

---

Create a new `{Entity}` module in this project.

Follow these required sources first:
- `front/docs/AGENT_NEW_CRUD_MODULE.md`
- `front/docs/UI_CSS_CLASSES.md`
- `.cursorrules`

Reference pages:
- Basic baseline: `front/src/views/pages/clients/ClientsPage.vue` and `front/src/views/pages/clients/ClientCreatePage.vue`
- Advanced baseline (only if explicitly required): `front/src/views/pages/orders/OrdersPage.vue` and `front/src/views/pages/orders/OrderCreatePage.vue`

Requirements:
1. Reuse existing project architecture, components, mixins, DTO patterns, and backend contracts.
2. Keep DRY and do not duplicate logic.
3. Do not add fallback branches or silent recovery.
4. Fix root causes instead of masking issues.
5. Avoid redundant checks, especially formal type checks already guaranteed by DTO/validation/contracts.
6. Make minimal, targeted changes only.
7. Keep visual and interaction patterns consistent with the baseline pages.

Implement full stack for `{Entity}` where required:
- Front list page (`{Entity}Page.vue`)
- Front create/edit page (`{Entity}CreatePage.vue`)
- Filters component (if needed)
- API controller (`front/src/api/{Entity}Controller.js`)
- DTO (`front/src/dto/{entity}/{Entity}Dto.js`)
- Router and i18n integration
- Backend controller/repository/resource/requests/policy/routes (if included in task)

Before coding:
- Briefly state which baseline you choose (basic or advanced) and why.

After coding:
- Provide changed file list and a concise verification checklist.

Do not invent a new page architecture if the current project pattern already covers the task.

---

Optional input block to fill before run:
- Entity name: `{Entity}`
- Scope: `{front only | front+back}`
- Complexity: `{basic | advanced}`
- Special features: `{kanban, nested modals, payments, timeline, etc.}`
