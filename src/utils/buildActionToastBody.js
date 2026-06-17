import { h } from 'vue';

/**
 * @param {{ text: string, actionLabel: string, actionIcon?: string, onAction: () => void, closeToast: () => void }} params
 * @returns {import('vue').VNode}
 */
export function buildActionToastBody({ text, actionLabel, actionIcon, onAction, closeToast }) {
  const actionChildren = [];
  if (actionIcon) {
    actionChildren.push(
      h('i', { class: `fas ${actionIcon} text-[12px]`, 'aria-hidden': 'true' }),
    );
  }
  actionChildren.push(h('span', null, actionLabel));

  return h('div', { class: 'flex w-full min-w-0 flex-col gap-2 py-0.5' }, [
    h('div', { class: 'w-full min-w-0 whitespace-pre-line text-[15px] font-medium leading-snug' }, text),
    h(
      'button',
      {
        type: 'button',
        class: 'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/15 px-2.5 py-1.5 text-[13px] font-semibold leading-none shadow-sm backdrop-blur-[2px] transition hover:bg-white/25 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        'aria-label': actionLabel,
        onClick: (event) => {
          event.stopPropagation();
          onAction();
          closeToast();
        },
      },
      actionChildren,
    ),
  ]);
}
