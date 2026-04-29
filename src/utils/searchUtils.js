export function resolveSearchQuery(query, minLength = 3) {
  const inputValue = String(query).trim();

  if (!inputValue.length) {
    return { inputValue: '', shouldFetch: true };
  }

  if (inputValue.length < minLength) {
    return { inputValue, shouldFetch: false };
  }

  return { inputValue, shouldFetch: true };
}

const defaultHighlightWrapper = (match) =>
  `<mark class="search-highlight-mark">${match}</mark>`;

export function highlightMatches(text, search, wrapMatch = defaultHighlightWrapper) {
  if (!text || !search) {
    return text;
  }

  const searchStr = String(search).trim();
  if (!searchStr) {
    return text;
  }

  const textStr = String(text);
  const escaped = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');

  return textStr.replace(regex, (m) => wrapMatch(m));
}

