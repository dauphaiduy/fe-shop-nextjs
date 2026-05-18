"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { orderService } from "@/services/order.service";
import { formatDateTime, formatPrice } from "@/utils/helpers";
import type { Order, OrderStatus } from "@/types/order";
import Loading from "@/components/common/loading";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-400/10 text-yellow-300 border-yellow-400/40",
  CONFIRMED: "bg-orange-400/10 text-orange-300 border-cyan-400/40",
  SHIPPED: "bg-purple-400/10 text-purple-300 border-purple-400/40",
  DELIVERED: "bg-emerald-400/10 text-emerald-300 border-emerald-400/40",
  CANCELLED: "bg-white/5 text-white/40 border-white/10",
  REFUNDED: "bg-red-400/10 text-red-300 border-red-400/40",
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
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
    orderService
      .getById(id)
      .then((res) => { setOrder(res.data); setLoading(false); })
      .catch((err) => {
        if (err?.status === 404) notFound();
        setLoading(false);
      });
  }, [params.id]);

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      const res = await orderService.cancel(order.id);
      setOrder(res.data);
      showToast("Order cancelled.", true);
    } catch (err: unknown) {
      showToast(
        (err as { message?: string })?.message ?? "Failed to cancel order.",
        false,
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Loading />;
  if (!order) return null;

  const statusStyle = STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-600 border-gray-200";

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

      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-white/40 flex items-center gap-2">
        <Link href="/orders" className="hover:text-orange-400 transition uppercase tracking-wider text-xs">
          My Orders
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-white/70 font-mono">Order #{order.id}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/90">
                      {item.product?.name ?? `Product #${item.productId}`}
                    </p>
                    <p className="text-xs text-white/30 font-mono mt-0.5">
                      Unit price: {formatPrice(item.priceAtTime)}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-white/40">Qty: {item.quantity}</span>
                      <span className="text-sm font-bold font-mono text-orange-400">
                        {formatPrice(parseFloat(item.priceAtTime) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1 space-y-4">
          {/* Status & Actions */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Order Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Order ID</span>
                <span className="font-mono font-medium text-white/80">#{order.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40">Status</span>
                <span
                  className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${statusStyle}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Placed</span>
                <span className="font-mono text-xs text-white/70">{formatDateTime(order.createdAt)}</span>
              </div>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex justify-between">
                  <span className="text-white/40">Updated</span>
                  <span className="font-mono text-xs text-white/70">{formatDateTime(order.updatedAt)}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="font-bold text-white/70 uppercase tracking-wider text-xs">Total</span>
                <span className="text-xl font-extrabold text-orange-400 font-mono drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>

            {order.status === "PENDING" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="mt-5 w-full rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition uppercase tracking-wider"
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}

            <Link
              href="/orders"
              className="mt-3 block text-center text-xs text-white/40 hover:text-orange-400 transition uppercase tracking-wider"
            >
              ← Back to orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
