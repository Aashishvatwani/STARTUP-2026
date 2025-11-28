"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageReveal } from "@/components/UI/PageReveal";
import { Button } from "@/components/UI/Button";
import axios from "axios";
import { useRouter } from "next/navigation";

type Payout = {
  accountHolderName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  upi?: string;
};

export default function SolverAccountPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  // User fields we collect/update
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [about, setAbout] = useState("");
  const [offering, setOffering] = useState("");
  const [skills, setSkills] = useState(""); // comma separated
  const [pricePerJob, setPricePerJob] = useState<number | "">("");
  const [speed, setSpeed] = useState<number | "">("");
  const [payout, setPayout] = useState<Payout>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const highSkillOfferings = [
    "Website / Developer",
    "Mobile App / Developer",
    "Data Science / ML",
    "Backend / API",
    "Embedded / Firmware",
  ];

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const offeringDescriptions: Record<
    string,
    { desc: string; samples?: string[] }
  > = {
    "Website / Developer": {
      desc: "Build responsive websites, landing pages, and full-stack web apps.",
      samples: ["React", "Next.js", "Tailwind"],
    },
    "Mobile App / Developer": {
      desc: "Native or cross-platform mobile application development.",
      samples: ["Flutter", "React Native", "Swift"],
    },
    "Data Science / ML": {
      desc: "Data analysis, modeling, and machine learning pipelines.",
      samples: ["Python", "scikit-learn", "PyTorch"],
    },
    "Backend / API": {
      desc: "Design and implement robust APIs and server-side systems.",
      samples: ["Golang", "Node.js", "Postgres"],
    },
    Design: {
      desc: "UI/UX, product design and prototyping.",
      samples: ["Figma", "Sketch"],
    },
    Writing: {
      desc: "Technical and creative writing, reports, and documentation.",
    },
    Research: {
      desc: "Literature review, technical research and reports.",
    },
    "Embedded / Firmware": {
      desc: "Hardware interfacing, firmware and embedded systems.",
      samples: ["C", "Arduino", "RTOS"],
    },
    Other: {
      desc: "Other professional offerings.",
    },
  };

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const id = raw ? String(raw).trim().replace(/:\d+$/, "") : null;

    if (!id) {
      router.push("/reciever/login");
      return;
    }

    setUserId(id);

    (async () => {
      try {
        const base =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";
        const res = await axios.get(`${base}/users/${id}`);
        if (res?.data) {
          const u = res.data;
          setName(u.name || "");
          setEmail(u.email || "");
          setOffering(u.specialization || u.offering || "");
          setSkills((u.skills || []).join(", "));
          setPricePerJob(u.price_per_job ?? u.pricePerJob ?? "");
          setSpeed(u.speed ?? "");
          if (u.payout) setPayout(u.payout);
        }
      } catch {
        // ignore fetch error; user can still fill the form
      }
    })();
  }, [router]);

  function validatePayout(p: Payout) {
    const hasUPI = !!(p.upi && String(p.upi).trim());
    const hasBank = !!(
      p.accountHolderName &&
      p.accountNumber &&
      p.ifsc &&
      p.bankName
    );
    return hasUPI || hasBank;
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!validatePayout(payout)) {
      setError(
        "Please provide either a UPI ID or complete bank account details (holder, number, IFSC, bank)."
      );
      return;
    }

    if (
      highSkillOfferings.includes(offering) &&
      (!skills ||
        skills.split(",").map((s) => s.trim()).filter(Boolean).length === 0)
    ) {
      setError("Please list your technical skills for the selected offering.");
      return;
    }

  

    setLoading(true);
    try {
      const base =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";
      const jsonPayload = {
        name,
        email,
        about,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        offering,
        price_per_job:
          typeof pricePerJob === "number"
            ? pricePerJob
            : pricePerJob
            ? Number(pricePerJob)
            : 0,
        speed:
          typeof speed === "number"
            ? speed
            : speed
            ? Number(speed)
            : 0,
        payout,
      };

      const url = userId
        ? `${base}/users/${userId}/update`
        : `${base}/users/update`;

        await axios.put(url, jsonPayload);
      

      router.push("/solver/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save details"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageReveal className="max-w-4xl mx-auto px-4 py-8 md:py-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Solver Account
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Set up your profile, offerings, and payout details so clients can
            start booking you.
          </p>
        </div>
        {/* Small status badge */}
        <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
          {userId ? "Editing profile" : "New profile"}
        </span>
      </div>

      {/* Main Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-black-secondary/70 border border-white/[0.08] rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl p-5 md:p-8 space-y-8"
      >
        {/* Section: Profile */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-gray-200 uppercase">
              Profile
            </h2>
            <span className="text-[11px] text-gray-500">
              This is what clients will see.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400">
              Short bio
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="1–2 sentences about your experience, stack, or niche. Example: “Full-stack developer specializing in React & Node.js with 3+ years of freelancing.”"
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white min-h-[80px] resize-none outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
            />
          </div>
        </section>

        {/* Section: Offering & Skills */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-gray-200 uppercase">
              Offering & Skills
            </h2>
            <span className="text-[11px] text-gray-500">
              Choose what you mainly help with.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-400">
                Primary Offering
              </label>
              <div className="relative mt-1">
                <select
                  value={offering}
                  onChange={(e) => setOffering(e.target.value)}
                  className="appearance-none w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 pr-9 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
                >
                  <option value="">Select offering (optional)</option>
                  <option>Website / Developer</option>
                  <option>Mobile App / Developer</option>
                  <option>Data Science / ML</option>
                  <option>Backend / API</option>
                  <option>Design</option>
                  <option>Writing</option>
                  <option>Research</option>
                  <option>Embedded / Firmware</option>
                  <option>Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Skills for technical offerings */}
              {highSkillOfferings.includes(offering) && (
                <div className="mt-4 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-400">
                      Skills (comma separated)
                    </label>
                    <input
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="React, Next.js, Tailwind, Node.js"
                      className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
                    />
                  </div>

                  {/* Offering description box */}
                  {offering && (
                    <div className="mt-1 rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-gray-300">
                      <div className="mb-1">
                        {offeringDescriptions[offering]?.desc || ""}
                      </div>
                      {offeringDescriptions[offering]?.samples && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {offeringDescriptions[offering].samples!.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] text-gold"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resume upload (only for high-skill offerings) */}

          </div>
        </section>

        {/* Section: Rates */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-gray-200 uppercase">
              Rates & Speed
            </h2>
            <span className="text-[11px] text-gray-500">
              Let clients know how you charge and how fast you deliver.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400">
                Price per job (₹)
              </label>
              <input
                value={pricePerJob}
                onChange={(e) =>
                  setPricePerJob(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                type="number"
                min={0}
                placeholder="e.g. 500"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                You can always negotiate per project. This is your usual rate.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400">
                Avg completion speed (hours)
              </label>
              <input
                value={speed}
                onChange={(e) =>
                  setSpeed(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                type="number"
                min={0}
                placeholder="e.g. 24"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Typical time you take to deliver a standard job.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Payout */}
        <section className="space-y-4 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-gray-200 uppercase">
              Payout / Bank Details
            </h2>
            <span className="text-[11px] text-orange-300">
              Required to receive payments.
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400">
                UPI ID
                <span className="text-gray-500 font-normal">
                  {" "}
                  (optional, preferred)
                </span>
              </label>
              <input
                value={payout.upi || ""}
                onChange={(e) =>
                  setPayout((prev) => ({ ...prev, upi: e.target.value }))
                }
                placeholder="example@upi"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Fastest way to get paid. If you don&apos;t use UPI, fill in full
                bank details below.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span className="h-px flex-1 bg-white/10" />
              <span>OR</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={payout.accountHolderName || ""}
                onChange={(e) =>
                  setPayout((prev) => ({
                    ...prev,
                    accountHolderName: e.target.value,
                  }))
                }
                placeholder="Account holder name"
                className="rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
              />
              <input
                value={payout.accountNumber || ""}
                onChange={(e) =>
                  setPayout((prev) => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))
                }
                placeholder="Account number"
                className="rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
              />
              <input
                value={payout.ifsc || ""}
                onChange={(e) =>
                  setPayout((prev) => ({
                    ...prev,
                    ifsc: e.target.value,
                  }))
                }
                placeholder="IFSC"
                className="rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
              />
              <input
                value={payout.bankName || ""}
                onChange={(e) =>
                  setPayout((prev) => ({
                    ...prev,
                    bankName: e.target.value,
                  }))
                }
                placeholder="Bank name"
                className="rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-gold focus:ring-1 focus:ring-gold/70"
              />
            </div>
          </div>
        </section>

        {/* Error + Submit */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full py-2.5 text-sm font-medium"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Account Details"}
          </Button>
        </div>
      </form>
    </PageReveal>
  );
}
