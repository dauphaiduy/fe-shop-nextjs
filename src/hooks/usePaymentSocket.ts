"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { PaymentTransaction } from "@/types/payment";

// Derive WS base from the API URL by stripping the /v1 path prefix.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";
const WS_BASE = API_URL.replace(/\/v\d+.*$/, ""); // e.g. "http://localhost:3000"

export interface PaymentPendingEvent {
  orderId: number;
  transactionId: string;
  status: "PROCESSING";
  paymentUrl: string;
  qrCode: string;
  provider: string;
}

export interface PaymentStatusEvent {
  orderId: number;
  transactionId: string;
  status: PaymentTransaction["status"];
}

interface UsePaymentSocketOptions {
  orderId: number;
  accessToken: string | null;
  onPending?: (data: PaymentPendingEvent) => void;
  onSuccess?: (data: PaymentStatusEvent) => void;
  onFailed?: (data: PaymentStatusEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function usePaymentSocket({
  orderId,
  accessToken,
  onPending,
  onSuccess,
  onFailed,
  onConnected,
  onDisconnected,
}: UsePaymentSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken || !orderId) return;

    const socket = io(`${WS_BASE}/payment`, {
      auth: { token: `Bearer ${accessToken}` },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe_payment", { orderId });
      onConnected?.();
    });

    socket.on("disconnect", () => {
      onDisconnected?.();
    });

    socket.on("payment:pending", (data: PaymentPendingEvent) => {
      onPending?.(data);
    });

    socket.on("payment:success", (data: PaymentStatusEvent) => {
      onSuccess?.(data);
    });

    socket.on("payment:failed", (data: PaymentStatusEvent) => {
      onFailed?.(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, accessToken]);

  return socketRef;
}
