"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cart.store";
import { useUiStore } from "@/store/ui.store";

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, loadCount } = useCartStore();
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUiStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) loadCount();
  }, [isAuthenticated, loadCount]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-transparent backdrop-blur-none border-b border-transparent transition-all duration-300">
      <div className="mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-extrabold tracking-widest text-orange-400 uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
          NekoLi
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          <Link
            href="/products"
            className={`text-sm font-medium uppercase tracking-wider transition-colors ${
              pathname.startsWith("/products")
                ? "text-orange-400"
                : "text-white/60 hover:text-white"
            }`}
          >
            Products
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className={`relative text-sm font-medium uppercase tracking-wider transition-colors ${
              pathname === "/cart"
                ? "text-orange-400"
                : "text-white/60 hover:text-white"
            }`}
          >
            Cart
            {isAuthenticated && itemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none shadow-[0_0_6px_rgba(6,182,212,0.8)]">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition"
              >
                <span className="w-7 h-7 rounded-full bg-orange-500/20 border border-cyan-400/40 text-orange-300 flex items-center justify-center text-xs font-semibold uppercase">
                  {(user?.name ?? user?.email ?? "U")[0]}
                </span>
                <span>{user?.name ?? user?.email}</span>
                <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-[#0d0d1a] rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1 z-50">
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-sm text-white/70 hover:text-orange-300 hover:bg-white/5 transition"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-white/70 hover:text-orange-300 hover:bg-white/5 transition"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <hr className="my-1 border-white/10" />
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-white/60 hover:text-white uppercase tracking-wider transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-orange-500 text-white px-4 py-1.5 rounded-lg hover:bg-orange-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all uppercase tracking-wider"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile: cart + hamburger */}
        <div className="sm:hidden flex items-center gap-3">
          <Link href="/cart" className="relative text-white/60 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {isAuthenticated && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(6,182,212,0.8)]">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={toggleMobileMenu}
            className="text-white/60 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-[#0d0d1a] px-4 py-3 space-y-1">
          <Link href="/products" className="block py-2.5 text-sm font-medium uppercase tracking-wider text-white/70 hover:text-orange-300 transition">
            Products
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/orders" className="block py-2.5 text-sm font-medium uppercase tracking-wider text-white/70 hover:text-orange-300 transition">
                My Orders
              </Link>
              <Link href="/profile" className="block py-2.5 text-sm font-medium uppercase tracking-wider text-white/70 hover:text-orange-300 transition">
                Profile
              </Link>
              <button
                onClick={logout}
                className="block w-full text-left py-2.5 text-sm font-medium uppercase tracking-wider text-red-400 hover:text-red-300 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block py-2.5 text-sm font-medium uppercase tracking-wider text-white/70 hover:text-orange-300 transition">
                Login
              </Link>
              <Link href="/register" className="block py-2.5 text-sm font-medium uppercase tracking-wider text-orange-400 hover:text-orange-300 transition">
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
