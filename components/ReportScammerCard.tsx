"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Send, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { submitScamReport } from "@/lib/scamReports";
import { useAuth } from "@/lib/authContext";

interface ReportScammerCardProps {
  initialContact?: string;
  messageSnippet: string;
  riskScore: number;
  scamType?: string;
  onReported?: (report: any) => void;
}

export default function ReportScammerCard({
  initialContact = "",
  messageSnippet,
  riskScore,
  scamType,
  onReported,
}: ReportScammerCardProps) {
  const { user } = useAuth();
  const [contact, setContact] = useState(initialContact);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) {
      setError("Please enter a phone number or email.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rep = await submitScamReport({
        contact: contact.trim(),
        messageSnippet,
        riskScore,
        scamType,
        reportedBy: user?.email || user?.displayName || "Anonymous User",
      });
      setSubmitted(true);
      if (onReported) {
        onReported(rep);
      }
    } catch (err: any) {
      setError("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 text-emerald-900 animate-in fade-in">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-emerald-950">
              Scammer Reported to Community Radar!
            </h4>
            <p className="text-xs text-emerald-800 mt-1">
              Thank you! <span className="font-mono font-semibold">{contact}</span> has been stored and added to the public scam directory to help warn others.
            </p>
            <div className="mt-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
              >
                View Scam Radar Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 sm:p-5 text-slate-800 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 text-amber-700">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-amber-950">
            Help Us Protect Others in Pakistan
          </h4>
          <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
            Please help the community by providing the phone number or email where this fake message originated. We will flag it on the safety dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-3 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. +92 300 1234567 or scammer@fakebank.com"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-amber-300/80 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Report Scammer
                  </>
                )}
              </button>
            </div>
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
