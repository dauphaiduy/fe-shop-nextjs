"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { cartService } from "@/services/cart.service";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useCartStore } from "@/store/cart.store";
import { formatPrice } from "@/utils/helpers";
import type { Product, ProductListQuery } from "@/types/product";
import type { Category } from "@/types/category";
import type { PaginatedData } from "@/types/api";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";

const LIMIT = 12;

export default function ProductsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { loadCount } = useCartStore();

  const [products, setProducts] = useState<PaginatedData<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput, 400);

  const [addingId, setAddingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Track previous filter values to detect changes and reset page
  const prevFiltersRef = useRef({ debouncedSearch, categoryId });

  // Fetch products — when filters change, automatically use page 1
  useEffect(() => {
    const filtersChanged =
      prevFiltersRef.current.debouncedSearch !== debouncedSearch ||
      prevFiltersRef.current.categoryId !== categoryId;
    prevFiltersRef.current = { debouncedSearch, categoryId };

    const effectivePage = filtersChanged ? 1 : page;
    if (filtersChanged && page !== 1) setPage(1);

    let cancelled = false;
    const query: ProductListQuery = {
      name: debouncedSearch || undefined,
      categoryId,
      page: effectivePage,
      limit: LIMIT,
      status: "ACTIVE",
    };

    productService
      .list(query)
      .then((res) => { if (!cancelled) { setProducts(res.data); setLoading(false); setError(null); } })
      .catch(() => { if (!cancelled) { setError("Failed to load products."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [debouncedSearch, categoryId, page]);

  // Fetch categories once
  useEffect(() => {
    categoryService.list().then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const handleAddToCart = async (productId: number) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products`);
      return;
    }
    setAddingId(productId);
    try {
      await cartService.addItem({ productId, quantity: 1 });
      loadCount();
      showToast("Added to cart!", true);
    } catch (err: unknown) {
      showToast(
        (err as { message?: string })?.message ?? "Could not add to cart.",
        false,
      );
    } finally {
      setAddingId(null);
    }
  };

  const totalPages = products ? Math.ceil(products.total / LIMIT) : 1;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-opacity ${
            toast.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Products</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : !products?.items.length ? (
        <EmptyState description="No products found." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.items.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="relative aspect-square bg-gray-100">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-3 flex flex-col flex-1">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600">
                      {product.name}
                    </h3>
                  </Link>
                  {product.category && (
                    <span className="mt-1 text-xs text-gray-400">
                      {product.category.name}
                    </span>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base font-bold text-blue-600">
                      {formatPrice(product.price)}
                    </span>
                    {product.stock > 0 ? (
                      <span className="text-xs text-green-600">In stock</span>
                    ) : (
                      <span className="text-xs text-red-500">Out of stock</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock === 0 || addingId === product.id}
                    className="mt-3 w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingId === product.id ? "Adding..." : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
