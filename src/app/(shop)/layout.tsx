"use client";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d1a]">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-20 pb-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
