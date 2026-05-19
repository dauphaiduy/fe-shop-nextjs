"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
import { paymentService } from "@/services/payment.service";
import { formatPrice } from "@/utils/helpers";
import type { PaymentProvider, PaymentTransaction } from "@/types/payment";

const PROVIDERS: { id: PaymentProvider; label: string; description: string; available: boolean }[] = [
  {
    id: "SEPAY",
    label: "SePay (Bank Transfer QR)",
    description: "Scan QR code and transfer via your banking app",
    available: true,
  },
  {
    id: "MOMO",
    label: "MoMo",
    description: "Pay with MoMo e-wallet",
    available: false,
  },
  {
    id: "ZALOPAY",
    label: "ZaloPay",
    description: "Pay with ZaloPay e-wallet",
    available: false,
  },
  {
    id: "VNPAY",
    label: "VNPay",
    description: "Pay via VNPay gateway",
    available: false,
  },
];

// Polling fallback: used only when WS has not connected
const POLL_INTERVAL = 3000;

interface PaymentModalProps {
  orderId: number;
  totalAmount: string;
  onClose: () => void;
  onPaymentSuccess: (transaction: PaymentTransaction) => void;
}

type ModalStep = "select" | "paying" | "success" | "failed";

export default function PaymentModal({
  orderId,
  totalAmount,
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) {
  const { accessToken } = useAuth();

  const [step, setStep] = useState<ModalStep>("select");
  const [provider, setProvider] = useState<PaymentProvider>("SEPAY");
  const [initiating, setInitiating] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolvedRef = useRef(false); // prevent double-resolve from WS + poll race

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const resolve = (tx: PaymentTransaction | null, success: boolean) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    stopPolling();
    if (tx) setTransaction(tx);
    if (success) {
      setStep("success");
      if (tx) onPaymentSuccess(tx);
    } else {
      setStep("failed");
    }
  };

  // ── WebSocket ─────────────────────────────────────────────────────────────
  usePaymentSocket({
    orderId,
    accessToken,
    onConnected: () => setWsConnected(true),
    onDisconnected: () => setWsConnected(false),
    onPending: (data) => {
      // WS confirmed checkout — use WS qrCode if we don't have one yet
      if (!paymentUrl && data.qrCode) setPaymentUrl(data.qrCode);
      if (!refCode && data.transactionId) setRefCode(data.transactionId);
      stopPolling(); // WS is alive, no need to poll
    },
    onSuccess: (data) => {
      resolve(
        {
          id: 0,
          orderId: data.orderId,
          provider,
          transactionId: data.transactionId,
          amount: totalAmount,
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
          provider,
          transactionId: data.transactionId,
          amount: totalAmount,
          status: data.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        false,
      );
    },
  });

  // ── Polling fallback ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const startPollingFallback = () => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      if (wsConnected) {
        stopPolling();
        return;
      }
      try {
        const res = await paymentService.getStatus(orderId);
        const latest = res.data.find(
          (t) => t.status === "SUCCESS" || t.status === "FAILED" || t.status === "EXPIRED",
        );
        if (latest) resolve(latest, latest.status === "SUCCESS");
      } catch {
        // keep polling
      }
    }, POLL_INTERVAL);
  };

  // ── Initiate payment ──────────────────────────────────────────────────────
  const handleInitiatePayment = async () => {
    setInitiating(true);
    setError(null);
    resolvedRef.current = false;

    try {
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/payment/result?orderId=${orderId}`
          : undefined;

      const res = await paymentService.checkout({ orderId, provider, returnUrl });
      const { transactionId, paymentUrl: url, qrCode } = res.data;

      if (provider === "SEPAY") {
        setPaymentUrl(qrCode || url);
        setRefCode(String(transactionId));
        setStep("paying");
        // Only start polling fallback if WS isn't connected
        if (!wsConnected) {
          startPollingFallback();
        }
      } else {
        // Others: redirect to payment gateway
        window.location.href = url;
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to initiate payment.");
    } finally {
      setInitiating(false);
    }
  };

  const handleClose = () => {
    stopPolling();
    onClose();
  };

  const handleRetry = () => {
    resolvedRef.current = false;
    setStep("select");
    setPaymentUrl(null);
    setRefCode(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] shadow-[0_0_40px_rgba(6,182,212,0.1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="block w-1 h-5 bg-orange-400 rounded-full" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">
              {step === "select" && "Choose Payment Method"}
              {step === "paying" && "Complete Payment"}
              {step === "success" && "Payment Successful"}
              {step === "failed" && "Payment Failed"}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-white/30 hover:text-white/70 transition text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Amount */}
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/10">
            <span className="text-xs text-white/40 uppercase tracking-wider">Order #{orderId}</span>
            <span className="text-2xl font-extrabold text-orange-400 font-mono">
              {formatPrice(totalAmount)}
            </span>
          </div>

          {/* Step: Select provider */}
          {step === "select" && (
            <div className="space-y-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  disabled={!p.available}
                  onClick={() => p.available && setProvider(p.id)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                    !p.available
                      ? "opacity-40 cursor-not-allowed border-white/5 bg-white/5"
                      : provider === p.id
                      ? "border-orange-400/60 bg-orange-400/10 shadow-[0_0_12px_rgba(251,146,60,0.15)]"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                        provider === p.id && p.available
                          ? "border-orange-400 bg-orange-400"
                          : "border-white/30"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          provider === p.id && p.available ? "text-orange-300" : "text-white/80"
                        }`}
                      >
                        {p.label}
                        {!p.available && (
                          <span className="ml-2 text-xs font-normal text-white/30">(coming soon)</span>
                        )}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">{p.description}</p>
                    </div>
                  </div>
                </button>
              ))}

              {error && (
                <p className="text-xs text-red-400 font-mono mt-2">{error}</p>
              )}

              <button
                onClick={handleInitiatePayment}
                disabled={initiating}
                className="mt-2 w-full rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm font-bold text-white uppercase tracking-widest shadow-[0_0_16px_rgba(251,146,60,0.3)] transition-all"
              >
                {initiating ? "Initiating..." : "Proceed to Payment →"}
              </button>
            </div>
          )}

          {/* Step: Paying — SePay QR */}
          {step === "paying" && paymentUrl && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl border border-white/10 bg-white p-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Image
                  src={paymentUrl}
                  alt="Payment QR Code"
                  width={240}
                  height={240}
                  className="w-60 h-60 object-contain"
                  unoptimized
                />
              </div>

              {refCode && (
                <div className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                    Transfer description (required)
                  </p>
                  <p className="text-lg font-bold text-orange-400 font-mono tracking-widest">
                    {refCode}
                  </p>
                </div>
              )}

              <div className="w-full text-center space-y-1">
                <p className="text-xs text-white/50">
                  Scan the QR code with your banking app and include the transfer
                  description exactly as shown above.
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  <span className="text-xs text-white/40 font-mono">
                    {wsConnected
                      ? "Listening for payment confirmation..."
                      : "Waiting for payment confirmation..."}
                  </span>
                </div>
                {wsConnected && (
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-emerald-400/60 font-mono">Live</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-emerald-300 uppercase tracking-widest">
                  Payment Confirmed
                </p>
                <p className="text-xs text-white/40 mt-1 font-mono">
                  {transaction?.provider} · Txn #{transaction?.transactionId}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full rounded-xl bg-emerald-500/20 border border-emerald-400/40 hover:bg-emerald-500/30 px-4 py-2.5 text-sm font-bold text-emerald-300 uppercase tracking-widest transition-all"
              >
                Done
              </button>
            </div>
          )}

          {/* Step: Failed */}
          {step === "failed" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-red-400/20 border border-red-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-red-300 uppercase tracking-widest">
                  Payment {transaction?.status === "EXPIRED" ? "Expired" : "Failed"}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {transaction?.status === "EXPIRED"
                    ? "The payment window has expired. Please try again."
                    : "Your payment could not be processed. Please try again."}
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleRetry}
                  className="flex-1 rounded-xl border border-orange-400/40 bg-orange-400/10 hover:bg-orange-400/20 px-4 py-2.5 text-sm font-bold text-orange-300 uppercase tracking-widest transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-medium text-white/50 uppercase tracking-widest transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
