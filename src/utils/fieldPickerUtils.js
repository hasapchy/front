export function formatInlineLabel(primary, secondary, separator = ' · ') {
  const main = typeof primary === 'string' ? primary.trim() : '';
  const extra = typeof secondary === 'string' ? secondary.trim() : '';
  if (main && extra) {
    return `${main}${separator}${extra}`;
  }
  return main || extra || '';
}
