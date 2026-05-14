"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cartService } from "@/services/cart.service";
import { orderService } from "@/services/order.service";
import { useCartStore } from "@/store/cart.store";
import { formatPrice } from "@/utils/helpers";
import type { Cart } from "@/types/cart";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";

export default function CartPage() {
  const router = useRouter();
  const { loadCount } = useCartStore();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshCart = async () => {
    cartService.get()
      .then((res) => { setCart(res.data); setLoading(false); })
      .catch(() => { setCart(null); setLoading(false); });
  };

  useEffect(() => {
    cartService.get()
      .then((res) => { setCart(res.data); setLoading(false); })
      .catch(() => { setCart(null); setLoading(false); });
  }, []);

  const handleUpdateQty = async (productId: number, quantity: number) => {
    setUpdatingId(productId);
    try {
      await cartService.updateItem(productId, { quantity });
      await refreshCart();
      loadCount();
    } catch (err: unknown) {
      showToast(
        (err as { message?: string })?.message ?? "Failed to update quantity.",
        false,
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId: number) => {
    setUpdatingId(productId);
    try {
      await cartService.removeItem(productId);
      await refreshCart();
      loadCount();
    } catch {
      showToast("Failed to remove item.", false);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      await orderService.checkout();
      showToast("Order placed successfully!", true);
      loadCount();
      setTimeout(() => router.push("/orders"), 1200);
    } catch (err: unknown) {
      showToast(
        (err as { message?: string })?.message ?? "Checkout failed.",
        false,
      );
      setCheckingOut(false);
    }
  };

  const total =
    cart?.items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0) ?? 0;

  if (loading) return <Loading />;

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

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      {!cart?.items.length ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12">
          <EmptyState
            title="Your cart is empty"
            description="Add items from the product listing to get started."
          />
          <div className="flex justify-center mt-6">
            <Link
              href="/products"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4"
              >
                {/* Image */}
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {item.product?.images?.[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product?.name ?? ""}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                    >
                      {item.product?.name ?? `Product #${item.productId}`}
                    </Link>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      disabled={updatingId === item.productId}
                      className="shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-blue-600 font-semibold mt-1">
                    {formatPrice(item.product.price)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? handleUpdateQty(item.productId, item.quantity - 1)
                            : handleRemove(item.productId)
                        }
                        disabled={updatingId === item.productId}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-base leading-none disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                        disabled={updatingId === item.productId}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-base leading-none disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                        {formatPrice(parseFloat(item.product.price) * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="truncate mr-2">
                    {item.product.name} × {item.quantity}
                    </span>
                    <span className="shrink-0">{formatPrice(parseFloat(item.product.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-extrabold text-blue-600">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                {checkingOut ? "Placing order..." : "Proceed to Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
