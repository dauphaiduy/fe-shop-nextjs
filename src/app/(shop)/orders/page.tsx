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
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-gray-50 text-gray-600 border-gray-200",
  REFUNDED: "bg-red-50 text-red-600 border-red-200",
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {loading ? (
        <Loading />
      ) : !orders?.items.length ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12">
          <EmptyState title="No orders yet" description="Your orders will appear here after checkout." />
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
        <>
          <div className="space-y-4">
            {orders.items.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        Order #{order.id}
                      </span>
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${
                          STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(order.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-start flex-col gap-2 text-right">
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>

                {/* Item previews */}
                {order.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
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
