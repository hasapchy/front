export function insertEmojiAtCaret(textareaRef, draft, setDraft, emoji) {
  const ta = textareaRef?.value ?? textareaRef;
  if (ta && typeof ta.selectionStart === 'number') {
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = draft.slice(0, start);
    const after = draft.slice(end);
    const next = before + emoji + after;
    setDraft(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
    return next;
  }
  const next = `${draft}${emoji}`;
  setDraft(next);
  return next;
}
