export function isOsFileDrag(event) {
    return Array.from(event?.dataTransfer?.types || []).includes('Files');
}

export function extractDroppedFiles(event) {
    return Array.from(event?.dataTransfer?.files || []).filter((file) => file && file.name);
}

export function isImageFile(file) {
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    const mimeType = file?.mimeType || file?.type || '';
    const name = file?.name || '';
    return imageTypes.includes(mimeType) || /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(name);
}
