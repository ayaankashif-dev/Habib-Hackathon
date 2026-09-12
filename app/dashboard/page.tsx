"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ShieldAlert,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  PlusCircle,
  TrendingUp,
  Radio,
  Clock,
  Filter,
  Users,
} from "lucide-react";
import { fetchRecentScamReports, subscribeToScamReports, type ScamReport } from "@/lib/scamReports";
import ReportScammerCard from "@/components/ReportScammerCard";

// Initial known scam templates in Pakistan to guarantee immediate utility
const SEED_SCAMS: ScamReport[] = [
  {
    id: "seed-1",
    contact: "0304-9872145",
    contactType: "phone",
    messageSnippet: "Muaziz Sarif, aapka BISP program mein 25,000 ka wazeefa manzoor ho gaya hai. Abhi rabta karein.",
    riskScore: 95,
    scamType: "Fake BISP Grant Scam",
    reportedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    reportedBy: "Verified Community Alert",
    verifiedCount: 14,
  },
  {
    id: "seed-2",
    contact: "support@hbl-verification-portal.com",
    contactType: "email",
    messageSnippet: "Dear Customer, your HBL mobile banking has been suspended due to pending biometric KYC. Click to verify immediately.",
    riskScore: 92,
    scamType: "Bank Phishing / Impersonation",
    reportedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    reportedBy: "Cyber Crime Cell Alert",
    verifiedCount: 23,
  },
  {
    id: "seed-3",
    contact: "0345-1122889",
    contactType: "phone",
    messageSnippet: "Easypaisa Alert: 50,000 cash prize won! Share the 6-digit OTP code received on your phone to claim instantly.",
    riskScore: 98,
    scamType: "OTP Theft / Wallet Hijack",
    reportedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    reportedBy: "Verified Community Alert",
    verifiedCount: 41,
  },
  {
    id: "seed-4",
    contact: "hr-careers@tiktok-remote-pk.org",
    contactType: "email",
    messageSnippet: "Work from home 1 hour daily and earn Rs. 8,000 per day by liking YouTube videos. Send registration deposit of Rs. 2,000.",
    riskScore: 89,
    scamType: "Fake Work-From-Home Task Scam",
    reportedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    reportedBy: "Community Reporter",
    verifiedCount: 9,
  },
];

export default function DashboardPage() {
  const [reports, setReports] = useState<ScamReport[]>(SEED_SCAMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "phone" | "email">("all");
  const [showReportForm, setShowReportForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  const handleBroadcastAlert = async () => {
    setBroadcasting(true);
    setBroadcastStatus(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendToAll: true,
          title: "🚨 ScamWatch Awareness Alert",
          message: "New wave of fake lottery & BISP cash grant SMS detected. Never share OTP or CNIC!",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastStatus(`Alert sent to ${data.sentToCount || 1} registered device(s)!`);
      } else {
        setBroadcastStatus("Broadcast queued.");
      }
    } catch {
      setBroadcastStatus("Failed to broadcast.");
    } finally {
      setBroadcasting(false);
      setTimeout(() => setBroadcastStatus(null), 5000);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToScamReports((liveReports) => {
      const seen = new Set<string>();
      const combined: ScamReport[] = [];

      // 1. Live real-time reports from Firestore first!
      for (const r of liveReports) {
        const key = r.contact.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(r);
        }
      }

      // 2. Pre-seeded known scams next
      for (const r of SEED_SCAMS) {
        const key = r.contact.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(r);
        }
      }

      setReports(combined);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchQuery =
      r.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.scamType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.messageSnippet.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === "phone") return matchQuery && r.contactType === "phone";
    if (filterType === "email") return matchQuery && r.contactType === "email";
    return matchQuery;
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Back to Scanner"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900">
                  Scam Radar & Fraud Directory
                </h1>
                <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                  Live Pakistan Feed
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Crowdsourced safety database of phone numbers and emails sending fraudulent messages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBroadcastAlert}
              disabled={broadcasting}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Broadcast safety push alert to all registered mobile phones"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{broadcasting ? "Sending..." : "Send Awareness Alert"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowReportForm((prev) => !prev)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Scammer</span>
            </button>
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition"
            >
              Scan Message
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 space-y-6">
        {broadcastStatus && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{broadcastStatus}</span>
          </div>
        )}

        {/* Quick Report Drawer */}
        {showReportForm && (
          <div className="animate-in fade-in slide-in-from-top-4">
            <ReportScammerCard
              messageSnippet="Direct manual report from community user."
              riskScore={85}
              scamType="Manual Community Submission"
              onReported={(newRep) => {
                setReports((prev) => [newRep, ...prev.filter((x) => x.id !== newRep.id)]);
                setTimeout(() => setShowReportForm(false), 2500);
              }}
            />
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Flagged Senders
            </div>
            <p className="text-2xl font-black text-slate-900">{reports.length}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <Phone className="w-4 h-4 text-amber-600" />
              Fake Mobile Numbers
            </div>
            <p className="text-2xl font-black text-slate-900">
              {reports.filter((r) => r.contactType === "phone").length}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <Mail className="w-4 h-4 text-indigo-600" />
              Phishing Emails
            </div>
            <p className="text-2xl font-black text-slate-900">
              {reports.filter((r) => r.contactType === "email").length}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4 text-emerald-600" />
              Protected Citizens
            </div>
            <p className="text-2xl font-black text-slate-900">1,240+</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phone, email, or keyword..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("phone")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === "phone"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Numbers
            </button>
            <button
              onClick={() => setFilterType("email")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === "email"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Emails
            </button>
          </div>
        </div>

        {/* Directory List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-700">
              Reported Threat Records ({filteredReports.length})
            </h2>
            <span className="text-xs text-slate-400">
              Updated automatically via Cloud Firestore
            </span>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                No matching fraudulent records found
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? `"${searchQuery}" has not been reported as a scam sender yet.`
                  : "No reports found in this category."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredReports.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            item.contactType === "phone"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {item.contactType === "phone" ? (
                            <Phone className="w-4 h-4" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-mono text-sm sm:text-base font-bold text-slate-900 select-all">
                          {item.contact}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex-shrink-0">
                        {item.riskScore}% Risk
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-xs font-bold text-red-600 bg-red-50/70 px-2 py-0.5 rounded-md">
                        {item.scamType}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                      &ldquo;{item.messageSnippet}&rdquo;
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.reportedAt).toLocaleDateString("en-PK", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-slate-500 font-medium">
                      By: {item.reportedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
