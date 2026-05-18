"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { orderService } from "@/services/order.service";
import { formatDateTime, formatPrice } from "@/utils/helpers";
import type { Order, OrderStatus } from "@/types/order";
import type { PaginatedData } from "@/types/api";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";

const LIMIT = 10;

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-400/10 text-yellow-300 border-yellow-400/40",
  CONFIRMED: "bg-orange-400/10 text-orange-300 border-cyan-400/40",
  SHIPPED: "bg-purple-400/10 text-purple-300 border-purple-400/40",
  DELIVERED: "bg-emerald-400/10 text-emerald-300 border-emerald-400/40",
  CANCELLED: "bg-white/5 text-white/40 border-white/10",
  REFUNDED: "bg-red-400/10 text-red-300 border-red-400/40",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<PaginatedData<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    orderService
      .list({ page, limit: LIMIT })
      .then((res) => { setOrders(res.data); setLoading(false); })
      .catch(() => { setOrders(null); setLoading(false); });
  }, [page]);

  const totalPages = orders ? Math.ceil(orders.total / LIMIT) : 1;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <span className="block w-1 h-7 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        <h1 className="text-xl font-bold text-white uppercase tracking-widest">My Orders</h1>
      </div>

      {loading ? (
        <Loading />
      ) : !orders?.items.length ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12">
          <EmptyState title="No orders yet" description="Your orders will appear here after checkout." />
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
        <>
          <div className="space-y-4">
            {orders.items.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-cyan-400/30 hover:shadow-[0_0_16px_rgba(6,182,212,0.1)] transition-all"
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-mono font-medium text-white/80">
                        Order #{order.id}
                      </span>
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          STATUS_STYLES[order.status] ?? "bg-white/5 text-white/40 border-white/10"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 font-mono mt-1">
                      {formatDateTime(order.createdAt)}
                    </p>
                    <p className="text-xs text-white/40 mt-1.5">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-start flex-col gap-2 text-right">
                    <span className="text-lg font-bold text-orange-400 font-mono">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs text-orange-400/70 hover:text-orange-300 font-medium transition uppercase tracking-wider"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>

                {/* Item previews */}
                {order.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/30">
                    {order.items
                      .slice(0, 3)
                      .map((item) => item.product?.name ?? `Product #${item.productId}`)
                      .join(", ")}
                    {order.items.length > 3 && ` +${order.items.length - 3} more`}
                  </div>
                )}
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
