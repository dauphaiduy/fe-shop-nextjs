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
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="max-w-lg">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName ?? ""}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone ?? ""}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Delivery Address
              </label>
              <textarea
                name="address"
                value={form.address ?? ""}
                onChange={handleChange}
                placeholder="Enter your delivery address"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
