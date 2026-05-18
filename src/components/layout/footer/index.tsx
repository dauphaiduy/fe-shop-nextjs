import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0d0d1a] border-t border-white/10 mt-auto">
      <div className="max-w-8xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-white/30 font-mono tracking-wider uppercase">
          &copy; {new Date().getFullYear()} NekoLi. All rights reserved.
        </p>
        <nav className="flex items-center gap-6 text-xs text-white/40 uppercase tracking-wider">
          <Link href="/products" className="hover:text-orange-400 transition">
            Products
          </Link>
          <Link href="/cart" className="hover:text-orange-400 transition">
            Cart
          </Link>
          <Link href="/orders" className="hover:text-orange-400 transition">
            Orders
          </Link>
        </nav>
      </div>
    </footer>
  );
}
