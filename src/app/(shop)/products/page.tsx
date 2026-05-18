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
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-opacity font-mono ${
            toast.ok
              ? "bg-orange-500/20 border border-cyan-400/60 text-orange-300"
              : "bg-red-500/20 border border-red-400/60 text-red-300"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Page title */}
      <div className="flex items-center gap-3 mb-8">
        <span className="block w-1 h-7 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        <h1 className="text-xl font-bold text-white uppercase tracking-widest">Products</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
        />
        <select
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border border-white/10 bg-[#0d0d1a] text-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
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
        <div className="text-center text-red-400 py-12 font-mono">{error}</div>
      ) : !products?.items.length ? (
        <EmptyState description="No products found." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.items.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden
                  hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]
                  transition-all duration-200 flex flex-col group"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="relative aspect-square bg-white/5">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition duration-300 opacity-90"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/20">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* HUD corner accents */}
                    <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/50 rounded-tl" />
                    <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/50 rounded-br" />
                  </div>
                </Link>

                <div className="p-3 flex flex-col flex-1">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-sm font-medium text-white/90 line-clamp-2 hover:text-orange-300 transition">
                      {product.name}
                    </h3>
                  </Link>
                  {product.category && (
                    <span className="mt-1 text-xs text-white/40 uppercase tracking-wider">
                      {product.category.name}
                    </span>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base font-bold text-orange-400 font-mono">
                      {formatPrice(product.price)}
                    </span>
                    {product.stock > 0 ? (
                      <span className="text-xs text-emerald-400">In stock</span>
                    ) : (
                      <span className="text-xs text-red-400">Out of stock</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock === 0 || addingId === product.id}
                    className="mt-3 w-full rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white
                      hover:bg-orange-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_16px_rgba(6,182,212,0.5)]
                      disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed disabled:shadow-none
                      transition-all uppercase tracking-wider"
                  >
                    {addingId === product.id ? "Adding..." : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm rounded-lg border border-white/10 text-white/70 hover:border-cyan-400/60 hover:text-orange-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="text-sm text-white/40 font-mono">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 text-sm rounded-lg border border-white/10 text-white/70 hover:border-cyan-400/60 hover:text-orange-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
