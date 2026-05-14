import Link from "next/link";
import LoginForm from "@/modules/auth/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/products" className="text-2xl font-bold text-blue-600">
            ShopApp
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            New here?{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
