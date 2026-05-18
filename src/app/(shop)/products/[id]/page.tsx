"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Image from "next/image";
import { productService } from "@/services/product.service";
import { cartService } from "@/services/cart.service";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cart.store";
import { formatPrice } from "@/utils/helpers";
import type { Product } from "@/types/product";
import Loading from "@/components/common/loading";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { loadCount } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const id = Number(params.id);
    if (!id) {
      notFound();
      return;
    }
    productService
      .getById(id)
      .then((res) => {
        setProduct(res.data);
        setQuantity(1);
        setSelectedImage(0);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.status === 404) notFound();
        setLoading(false);
      });
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${params.id}`);
      return;
    }
    if (!product) return;
    setAdding(true);
    try {
      await cartService.addItem({ productId: product.id, quantity });
      loadCount();
      showToast("Added to cart!", true);
    } catch (err: unknown) {
      showToast(
        (err as { message?: string })?.message ?? "Could not add to cart.",
        false,
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Loading />;
  if (!product) return null;

  const images = product.images?.length ? product.images : [];

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border font-mono text-sm transition-opacity ${
            toast.ok
              ? "bg-orange-500/20 border-cyan-400/60 text-orange-300"
              : "bg-red-500/20 border-red-400/60 text-red-300"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-white/40 flex items-center gap-2">
        <Link href="/products" className="hover:text-orange-400 transition uppercase tracking-wider text-xs">
          Products
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-white/70 line-clamp-1">{product.name}</span>
      </nav>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-3">
              {images.length ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/20">
                  <svg
                    className="w-20 h-20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              {/* HUD corner accents */}
              <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
              <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60 rounded-br" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === i
                        ? "border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.category && (
              <span className="inline-block text-xs font-semibold text-orange-400 border border-cyan-400/40 bg-orange-400/10 px-2.5 py-1 rounded w-fit mb-3 uppercase tracking-wider">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl font-bold text-white mb-3">
              {product.name}
            </h1>
            <p className="text-3xl font-extrabold text-orange-400 font-mono mb-4 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">
              {formatPrice(product.price)}
            </p>

            {product.description && (
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            <div className="mb-4 text-sm">
              {product.stock > 0 ? (
                <span className="text-emerald-400 font-medium">
                  ✓ In stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-red-400 font-medium">Out of stock</span>
              )}
            </div>

            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-white/60 uppercase tracking-wider">
                  Qty
                </span>
                <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-white/60 hover:bg-white/10 hover:text-white transition text-lg leading-none"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 text-sm font-mono font-bold text-orange-300 min-w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    className="px-3 py-2 text-white/60 hover:bg-white/10 hover:text-white transition text-lg leading-none"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || adding}
                className="flex-1 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white uppercase tracking-widest
                  hover:bg-orange-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]
                  disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed disabled:shadow-none
                  transition-all"
              >
                {adding
                  ? "Adding..."
                  : product.stock === 0
                    ? "Out of Stock"
                    : "Add to Cart"}
              </button>
              <Link
                href="/products"
                className="rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-white/60 hover:border-cyan-400/60 hover:text-orange-300 transition"
              >
                Back
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
