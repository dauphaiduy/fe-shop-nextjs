"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { orderService } from "@/services/order.service";
import { formatDateTime, formatPrice } from "@/utils/helpers";
import type { Order, OrderStatus } from "@/types/order";
import Loading from "@/components/common/loading";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-gray-50 text-gray-600 border-gray-200",
  REFUNDED: "bg-red-50 text-red-600 border-red-200",
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
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-gray-500">
        <Link href="/orders" className="hover:text-blue-600">
          My Orders
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Order #{order.id}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.product?.name ?? `Product #${item.productId}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Unit price: {formatPrice(item.priceAtTime)}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                      <span className="text-sm font-bold text-gray-900">
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
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID</span>
                <span className="font-medium text-gray-900">#{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyle}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Placed</span>
                <span className="font-medium text-gray-900">{formatDateTime(order.createdAt)}</span>
              </div>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span className="font-medium text-gray-900">{formatDateTime(order.updatedAt)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-extrabold text-blue-600">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>

            {order.status === "PENDING" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="mt-5 w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}

            <Link
              href="/orders"
              className="mt-3 block text-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              ← Back to orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
