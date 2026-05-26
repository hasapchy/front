const ROBOTO_FONTS = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

/**
 * @param {unknown} pdfFonts
 * @returns {Record<string, string>}
 */
export function resolvePdfMakeVfs(pdfFonts) {
  if (!pdfFonts || typeof pdfFonts !== 'object') {
    return {};
  }
  if (pdfFonts.pdfMake?.vfs) {
    return pdfFonts.pdfMake.vfs;
  }
  if (pdfFonts.vfs) {
    return pdfFonts.vfs;
  }
  if (pdfFonts.default) {
    return resolvePdfMakeVfs(pdfFonts.default);
  }
  if ('Roboto-Regular.ttf' in pdfFonts) {
    return pdfFonts;
  }
  return {};
}

/**
 * @returns {Promise<import('pdfmake/build/pdfmake').default>}
 */
export async function getPdfMakeWithFonts() {
  const [{ default: pdfMake }, pdfFontsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  const pdfFonts = pdfFontsModule?.default ?? pdfFontsModule;
  pdfMake.vfs = resolvePdfMakeVfs(pdfFonts);
  pdfMake.fonts = ROBOTO_FONTS;
  return pdfMake;
}
