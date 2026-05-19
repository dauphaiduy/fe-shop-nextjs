"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { formatPrice } from "@/utils/helpers";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productService.list({ status: "ACTIVE", limit: 8, page: 1 }),
      categoryService.list(),
    ])
      .then(([productsRes, categoriesRes]) => {
        setFeaturedProducts(productsRes.data.items ?? []);
        setCategories(categoriesRes.data.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d1a]">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden h-screen flex">
          {/* Background video */}
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/hero.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          {/* Dark overlay so text stays readable */}
          <div className="absolute inset-0 bg-[#0d0d1a]/10" />
          {/* Neon grid background */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Radial glow — anchored bottom-left */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_10%_90%,rgba(6,182,212,0.18),transparent)]" />

          {/* Left — text anchored to bottom-left */}
          <div className="relative flex flex-col justify-end pb-16 px-8 md:px-16 max-w-xl z-10">
            <p className="text-xs uppercase tracking-[0.35em] text-orange-400 mb-4 font-semibold">
              Next-Gen Commerce
            </p>
            <h1 className="text-4xl sm:text-6xl font-extrabold mb-5 leading-tight text-white">
              Welcome to{" "}
              <span className="text-orange-300 drop-shadow-[0_0_24px_rgba(6,182,212,0.7)]">
                NekoLi
              </span>
            </h1>
            <p className="text-white/50 text-lg sm:text-xl mb-10 max-w-md">
              Discover thousands of products at unbeatable prices. Shop smarter,
              live better.
            </p>
            <div>
              <Link
                href="/products"
                className="inline-block bg-orange-500 text-white font-semibold px-10 py-3.5 rounded-lg shadow-[0_0_24px_rgba(6,182,212,0.5)] hover:bg-orange-400 hover:shadow-[0_0_36px_rgba(6,182,212,0.7)] transition-all duration-200 uppercase tracking-widest text-sm"
              >
                Shop Now
              </Link>
            </div>
          </div>

          {/* Right — reserved for future background / product showcase */}
          <div className="hidden md:flex flex-1 relative" />
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="max-w-8xl mx-auto px-4 py-14">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-1 h-6 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <h2 className="text-xl font-bold text-white uppercase tracking-widest">
                Shop by Category
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?categoryId=${cat.id}`}
                  className="flex flex-col items-center justify-center rounded-xl p-4 text-center group
                    border border-white/10 bg-white/5 backdrop-blur-sm
                    hover:border-cyan-400/60 hover:bg-orange-400/10
                    hover:shadow-[0_0_18px_rgba(6,182,212,0.25)] transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-white/10 group-hover:bg-orange-400/20 transition">
                    <span className="text-orange-400 text-xl font-bold">
                      {cat.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white/70 group-hover:text-orange-300 transition">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className="max-w-8xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="block w-1 h-6 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <h2 className="text-xl font-bold text-white uppercase tracking-widest">
                Featured Products
              </h2>
            </div>
            <Link
              href="/products"
              className="text-orange-400 hover:text-orange-300 text-sm font-semibold tracking-wider uppercase transition"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden animate-pulse"
                >
                  <div className="bg-white/10 h-44 w-full" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="text-white/40 text-center py-12">
              No products available yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden
                    hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]
                    transition-all duration-200 group"
                >
                  <div className="relative h-72 w-full bg-white/5">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition duration-300 opacity-90"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/20 text-4xl">
                        🛍️
                      </div>
                    )}
                    {/* HUD corner accents */}
                    <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
                    <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/60 rounded-br" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-white/90 line-clamp-2 mb-1">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">
                        {product.category.name}
                      </p>
                    )}
                    <p className="text-orange-400 font-bold font-mono tracking-tight">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA Banner */}
        <section className="relative overflow-hidden border-t border-white/10 py-16 px-4 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(6,182,212,0.08),transparent)]" />
          <div className="relative max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-2">
              Ready to start shopping?
            </h3>
            <p className="text-white/50 mb-8">
              Browse our full catalog and find exactly what you need.
            </p>
            <Link
              href="/products"
              className="inline-block bg-transparent border-2 border-cyan-400 text-orange-400 font-semibold px-10 py-3.5 rounded-lg
                shadow-[0_0_16px_rgba(6,182,212,0.3)] hover:bg-orange-400 hover:text-[#0d0d1a]
                hover:shadow-[0_0_32px_rgba(6,182,212,0.6)] transition-all duration-200 uppercase tracking-widest text-sm"
            >
              Browse All Products
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

