import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ShopApp. All rights reserved.
        </p>
        <nav className="flex items-center gap-4 text-sm text-gray-500">
          <Link href="/products" className="hover:text-gray-900 transition-colors">
            Products
          </Link>
          <Link href="/cart" className="hover:text-gray-900 transition-colors">
            Cart
          </Link>
          <Link href="/orders" className="hover:text-gray-900 transition-colors">
            Orders
          </Link>
        </nav>
      </div>
    </footer>
  );
}
