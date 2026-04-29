import ProductController from "@/api/ProductController";
import { retryWithExponentialBackoff } from "@/cache";

export function toSearchRow(p) {
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    description: p.description,
    sku: p.sku,
    image: p.image,
    category_id: p.categoryId,
    category_name: p.categoryName,
    categories: p.categories ?? [],
    stock_quantity: p.stockQuantity,
    unit_id: p.unitId,
    unit_name: p.unitName,
    unit_short_name: p.unitShortName,
    barcode: p.barcode,
    retail_price: p.retailPrice,
    wholesale_price: p.wholesalePrice,
    purchase_price: p.purchasePrice,
  };
}

export async function fetchSearchProducts(isProductsOnly, limit = 20) {
  try {
    if (isProductsOnly === true) {
      const res = await retryWithExponentialBackoff(
        () => ProductController.getItems(1, true, {}, limit),
        3
      );
      return {
        items: res.items.map(toSearchRow),
      };
    }
    if (isProductsOnly === false) {
      const res = await retryWithExponentialBackoff(
        () => ProductController.getItems(1, false, {}, limit),
        3
      );
      return {
        items: res.items.map(toSearchRow),
      };
    }
    const half = Math.ceil(limit / 2);
    const other = Math.max(1, limit - half);
    const [productsRes, servicesRes] = await Promise.all([
      retryWithExponentialBackoff(
        () => ProductController.getItems(1, true, {}, half),
        3
      ),
      retryWithExponentialBackoff(
        () => ProductController.getItems(1, false, {}, other),
        3
      ),
    ]);
    const merged = [...productsRes.items, ...servicesRes.items]
      .sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      })
      .slice(0, limit);
    return {
      items: merged.map(toSearchRow),
    };
  } catch (error) {
    /* eslint-disable-next-line no-console -- mirrors store diagnostics */
    console.error("Error loading products for search:", error);
    return { items: [] };
  }
}
