"use client";

import { useEffect, useState } from "react";
import { profileService } from "@/services/customer-profile.service";
import type { CustomerProfile, UpsertProfileRequest } from "@/types/customer-profile";
import Loading from "@/components/common/loading";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState<UpsertProfileRequest>({
    fullName: "",
    phone: "",
    address: "",
  });

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    profileService
      .get()
      .then((res) => {
        const profile: CustomerProfile = res.data;
        setForm({
          fullName: profile.fullName ?? "",
          phone: profile.phone ?? "",
          address: profile.address ?? "",
        });
      })
      .catch((err) => {
        // 404 is fine — user hasn't set a profile yet
        if (err?.status !== 404) {
          showToast("Could not load profile.", false);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: UpsertProfileRequest = {
        fullName: form.fullName || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      };
      await profileService.upsert(body);
      showToast("Profile saved successfully!", true);
    } catch (err: unknown) {
      showToast(
        (err as { message?: string })?.message ?? "Failed to save profile.",
        false,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border font-mono text-sm ${
            toast.ok
              ? "bg-orange-500/20 border-cyan-400/60 text-orange-300"
              : "bg-red-500/20 border-red-400/60 text-red-300"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <span className="block w-1 h-7 bg-orange-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        <h1 className="text-xl font-bold text-white uppercase tracking-widest">My Profile</h1>
      </div>

      <div className="max-w-lg">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName ?? ""}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone ?? ""}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                Delivery Address
              </label>
              <textarea
                name="address"
                value={form.address ?? ""}
                onChange={handleChange}
                placeholder="Enter your delivery address"
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white uppercase tracking-widest hover:bg-orange-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] hover:shadow-[0_0_24px_rgba(6,182,212,0.55)] disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
