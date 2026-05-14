"use client";

import { useEffect } from "react";
import {
  SessionProvider as NextAuthSessionProvider,
  useSession,
} from "next-auth/react";
import { setApiToken } from "@/services/api-client";

function ApiTokenSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    setApiToken(session?.accessToken ?? null);
  }, [session?.accessToken, status]);

  return null;
}

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider>
      <ApiTokenSync />
      {children}
    </NextAuthSessionProvider>
  );
}
