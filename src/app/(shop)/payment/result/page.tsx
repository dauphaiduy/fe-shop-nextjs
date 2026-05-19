"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
import { paymentService } from "@/services/payment.service";
import { formatPrice } from "@/utils/helpers";
import type { PaymentTransaction } from "@/types/payment";

const POLL_INTERVAL = 3000;
const MAX_POLLS = 40; // ~2 minutes

type ResultState = "loading" | "success" | "failed" | "invalid";

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const orderId = Number(searchParams.get("orderId"));

  const [state, setState] = useState<ResultState>(
    !Number(searchParams.get("orderId")) ? "invalid" : "loading",
  );
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const resolvedRef = useRef(false);

  const resolve = (tx: PaymentTransaction | null, success: boolean) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    if (pollRef.current) clearInterval(pollRef.current);
    if (tx) setTransaction(tx);
    setState(success ? "success" : "failed");
  };

  // ── WebSocket ─────────────────────────────────────────────────────────────
  usePaymentSocket({
    orderId,
    accessToken,
    onConnected: () => {
      setWsConnected(true);
      // WS is alive — stop polling to avoid redundant requests
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    },
    onDisconnected: () => {
      setWsConnected(false);
      // If still loading and not resolved, restart polling fallback
      if (!resolvedRef.current) startPollingFallback();
    },
    onSuccess: (data) => {
      resolve(
        {
          id: 0,
          orderId: data.orderId,
          provider: "SEPAY",
          transactionId: data.transactionId,
          amount: "0",
          status: "SUCCESS",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        true,
      );
    },
    onFailed: (data) => {
      resolve(
        {
          id: 0,
          orderId: data.orderId,
          provider: "SEPAY",
          transactionId: data.transactionId,
          amount: "0",
          status: data.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        false,
      );
    },
  });

  // ── Polling fallback ──────────────────────────────────────────────────────
  const startPollingFallback = () => {
    if (pollRef.current) return; // already polling
    const poll = async () => {
      if (wsConnected || resolvedRef.current) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        return;
      }
      try {
        const res = await paymentService.getStatus(orderId);
        const terminal = res.data.find(
          (t) =>
            t.status === "SUCCESS" ||
            t.status === "FAILED" ||
            t.status === "EXPIRED" ||
            t.status === "CANCELLED",
        );
        if (terminal) {
          resolve(terminal, terminal.status === "SUCCESS");
          return;
        }
        pollCountRef.current += 1;
        if (pollCountRef.current >= MAX_POLLS) {
          resolve(null, false);
        }
      } catch {
        // keep polling
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
  };

  useEffect(() => {
    if (!orderId) return;
    // Do an immediate status check then start polling as fallback;
    // if WS connects fast it will stop the polling.
    startPollingFallback();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!orderId || state === "invalid") {
    return (
      <div className="min-h-screen bg-[#0a0d13] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white/50 font-mono mb-4">Invalid payment result URL.</p>
          <Link href="/orders" className="text-orange-400 hover:text-orange-300 text-sm uppercase tracking-wider transition">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d13] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1117] shadow-[0_0_40px_rgba(6,182,212,0.08)] p-8">
        {/* Loading */}
        {state === "loading" && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-white uppercase tracking-widest">
                Verifying Payment
              </p>
              <p className="text-xs text-white/40 mt-1 font-mono">
                Order #{orderId}
              </p>
              {wsConnected && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-emerald-400/60 font-mono">Live</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {state === "success" && transaction && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_24px_rgba(52,211,153,0.3)]">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-bold text-emerald-300 uppercase tracking-widest">
                Payment Successful
              </p>
              <p className="text-xs text-white/40 font-mono">Order #{orderId}</p>
              <p className="text-2xl font-extrabold text-orange-400 font-mono mt-2">
                {formatPrice(transaction.amount)}
              </p>
              <p className="text-xs text-white/30 font-mono mt-1">
                {transaction.provider} · Ref: {transaction.transactionId}
              </p>
            </div>
            <Link
              href={`/orders/${orderId}`}
              className="w-full text-center rounded-xl bg-orange-500 hover:bg-orange-400 px-4 py-2.5 text-sm font-bold text-white uppercase tracking-widest shadow-[0_0_16px_rgba(251,146,60,0.3)] transition-all"
            >
              View Order →
            </Link>
          </div>
        )}

        {/* Failed / Expired */}
        {(state === "failed") && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-red-400/20 border border-red-400/40 flex items-center justify-center shadow-[0_0_24px_rgba(248,113,113,0.3)]">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-bold text-red-300 uppercase tracking-widest">
                {transaction?.status === "EXPIRED" ? "Payment Expired" : "Payment Failed"}
              </p>
              <p className="text-xs text-white/40 mt-1">
                {transaction?.status === "EXPIRED"
                  ? "The payment window has expired."
                  : "Your payment could not be completed."}
              </p>
              <p className="text-xs text-white/30 font-mono">Order #{orderId}</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => router.push(`/orders/${orderId}`)}
                className="w-full rounded-xl bg-orange-500/20 border border-orange-400/40 hover:bg-orange-500/30 px-4 py-2.5 text-sm font-bold text-orange-300 uppercase tracking-widest transition-all"
              >
                Retry Payment
              </button>
              <Link
                href="/orders"
                className="w-full text-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-medium text-white/50 uppercase tracking-widest transition-all"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
