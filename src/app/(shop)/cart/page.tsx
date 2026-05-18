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
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border font-mono text-sm ${
            toast.ok
              ? "bg-orange-500/20 border-cyan-400/60 text-orange-300"
              : "bg-red-500/20 border-red-400/60 text-red-300"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <span className="block w-1 h-7 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        <h1 className="text-xl font-bold text-white uppercase tracking-widest">Shopping Cart</h1>
      </div>

      {!cart?.items.length ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12">
          <EmptyState
            title="Your cart is empty"
            description="Add items from the product listing to get started."
          />
          <div className="flex justify-center mt-6">
            <Link
              href="/products"
              className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] transition-all uppercase tracking-wider"
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
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex gap-4"
              >
                {/* Image */}
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-white/5">
                  {item.product?.images?.[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product?.name ?? ""}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
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
                      className="text-sm font-medium text-white/90 hover:text-orange-300 line-clamp-2 transition"
                    >
                      {item.product?.name ?? `Product #${item.productId}`}
                    </Link>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      disabled={updatingId === item.productId}
                      className="shrink-0 text-white/30 hover:text-red-400 transition p-1"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-orange-400 font-mono font-semibold mt-1">
                    {formatPrice(item.product.price)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? handleUpdateQty(item.productId, item.quantity - 1)
                            : handleRemove(item.productId)
                        }
                        disabled={updatingId === item.productId}
                        className="px-2.5 py-1 text-white/50 hover:bg-white/10 hover:text-white transition text-base leading-none disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 text-sm font-mono font-bold text-orange-300 min-w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                        disabled={updatingId === item.productId}
                        className="px-2.5 py-1 text-white/50 hover:bg-white/10 hover:text-white transition text-base leading-none disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold font-mono text-white/80">
                        {formatPrice(parseFloat(item.product.price) * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sticky top-24">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm text-white/50 mb-4 font-mono">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="truncate mr-2">
                    {item.product.name} × {item.quantity}
                    </span>
                    <span className="shrink-0">{formatPrice(parseFloat(item.product.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white/80 uppercase tracking-wider text-xs">Total</span>
                  <span className="text-xl font-extrabold text-orange-400 font-mono drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white uppercase tracking-widest hover:bg-orange-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none disabled:cursor-not-allowed transition-all"
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
