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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-linear-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
              Welcome to ShopApp
            </h1>
            <p className="text-blue-100 text-lg sm:text-xl mb-8 max-w-xl mx-auto">
              Discover thousands of products at unbeatable prices. Shop smarter,
              live better.
            </p>
            <Link
              href="/products"
              className="inline-block bg-white text-blue-700 font-semibold px-8 py-3 rounded-full shadow hover:bg-blue-50 transition"
            >
              Shop Now
            </Link>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?categoryId=${cat.id}`}
                  className="flex flex-col items-center justify-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition text-center group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                    <span className="text-blue-600 text-xl font-bold">
                      {cat.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Featured Products
            </h2>
            <Link
              href="/products"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
                >
                  <div className="bg-gray-200 h-44 w-full" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              No products available yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group"
                >
                  <div className="relative h-44 w-full bg-gray-100">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 text-4xl">
                        🛍️
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="text-xs text-gray-400 mb-2">
                        {product.category.name}
                      </p>
                    )}
                    <p className="text-blue-600 font-bold">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA Banner */}
        <section className="bg-blue-50 border-t border-blue-100 py-12 px-4 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Ready to start shopping?
          </h3>
          <p className="text-gray-500 mb-6">
            Browse our full catalog and find exactly what you need.
          </p>
          <Link
            href="/products"
            className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-full shadow hover:bg-blue-700 transition"
          >
            Browse All Products
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

