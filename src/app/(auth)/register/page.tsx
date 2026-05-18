import Link from "next/link";
import RegisterForm from "@/modules/auth/components/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-[#0d0d1a]">
      {/* Left — full-height image panel */}
      <div className="hidden md:flex relative w-1/2 lg:w-3/5 overflow-hidden">
        <video
          src="/nice.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        {/* Cyber overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-[#0d0d1a] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#0d0d1a]/80 via-transparent to-transparent" />

        {/* Neon grid lines */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Text over image */}
        <div className="absolute bottom-12 left-10 right-10">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-400 mb-2 font-semibold">
            Next-Gen Commerce
          </p>
          <h2 className="text-4xl font-extrabold leading-tight text-white drop-shadow-lg">
            Join the future
            <br />
            <span className="text-orange-400">of shopping.</span>
          </h2>
          <p className="mt-3 text-white/60 text-sm">
            Create your account and explore thousands of products.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-block text-2xl font-extrabold tracking-widest text-orange-600 uppercase"
            >
              NekoLi
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-orange-600 hover:text-orange-500 transition"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Card */}
          <div className="relative rounded-2xl p-px bg-linear-to-br from-cyan-400/60 via-blue-400/30 to-purple-400/60 shadow-lg">
            <div className="rounded-2xl bg-white p-8">
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
