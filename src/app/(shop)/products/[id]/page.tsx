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
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-gray-500">
        <Link href="/products" className="hover:text-blue-600">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100 mb-3">
              {images.length ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
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
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImage === i
                        ? "border-blue-500"
                        : "border-transparent"
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
              <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit mb-3">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {product.name}
            </h1>
            <p className="text-3xl font-extrabold text-blue-600 mb-4">
              {formatPrice(product.price)}
            </p>

            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            <div className="mb-4 text-sm text-gray-500">
              {product.stock > 0 ? (
                <span className="text-green-600 font-medium">
                  ✓ In stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-red-500 font-medium">Out of stock</span>
              )}
            </div>

            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-gray-700">
                  Quantity
                </span>
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
                  >
                    −
                  </button>
                  <span className="px-4 py-1.5 text-sm font-medium text-gray-900 min-w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
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
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {adding
                  ? "Adding..."
                  : product.stock === 0
                    ? "Out of Stock"
                    : "Add to Cart"}
              </button>
              <Link
                href="/products"
                className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
