export const IMAGE_LOAD_ERROR_FALLBACK = '/favicon.png';

export const AVATAR_IMAGE_FALLBACK =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9ca3af"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'
    );

export function applyLogoImageFallback(event) {
    const el = event?.target;
    if (!el || el.tagName !== 'IMG') {
        return;
    }
    if (el.dataset.fallbackTried === '1') {
        el.style.display = 'none';
        return;
    }
    el.dataset.fallbackTried = '1';
    el.onerror = null;
    el.src = IMAGE_LOAD_ERROR_FALLBACK;
}

export function applyAvatarImageFallback(event) {
    const el = event?.target;
    if (!el || el.tagName !== 'IMG') {
        return;
    }
    if (el.dataset.fallbackTried === '1') {
        el.style.display = 'none';
        return;
    }
    el.dataset.fallbackTried = '1';
    el.onerror = null;
    el.src = AVATAR_IMAGE_FALLBACK;
}
