import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebaseClient";

export interface ScamReport {
  id: string;
  contact: string; // Phone number, email address, or shortcode
  contactType: "phone" | "email" | "handle";
  messageSnippet: string;
  riskScore: number;
  scamType: string;
  reportedAt: string;
  reportedBy?: string;
  verifiedCount?: number;
}

export function detectContactType(contact: string): "phone" | "email" | "handle" {
  if (contact.includes("@")) return "email";
  if (/[0-9]/.test(contact) && contact.length >= 4) return "phone";
  return "handle";
}

/**
 * Persist a scammer's phone number or email to Firestore
 */
export async function submitScamReport(params: {
  contact: string;
  messageSnippet: string;
  riskScore: number;
  scamType?: string;
  reportedBy?: string;
}): Promise<ScamReport> {
  const cleanContact = params.contact.trim();
  const contactType = detectContactType(cleanContact);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const report: ScamReport = {
    id,
    contact: cleanContact,
    contactType,
    messageSnippet: params.messageSnippet.slice(0, 300),
    riskScore: params.riskScore,
    scamType: params.scamType || "Digital Fraud / Phishing",
    reportedAt: now,
    reportedBy: params.reportedBy || "Anonymous User",
    verifiedCount: 1,
  };

  const reportRef = doc(db, "scam_reports", id);
  await setDoc(reportRef, report);

  return report;
}

/**
 * Fetch latest scam reports once
 */
export async function fetchRecentScamReports(maxReports: number = 50): Promise<ScamReport[]> {
  try {
    const q = query(
      collection(db, "scam_reports"),
      orderBy("reportedAt", "desc"),
      limit(maxReports)
    );
    const snap = await getDocs(q);
    const reports: ScamReport[] = [];
    snap.forEach((d) => {
      reports.push(d.data() as ScamReport);
    });
    return reports;
  } catch (err) {
    console.warn("Could not fetch scam reports from Firestore:", err);
    return [];
  }
}

/**
 * Real-time listener for live updates on the Scam Radar dashboard
 */
export function subscribeToScamReports(
  callback: (reports: ScamReport[]) => void,
  maxReports: number = 50
): () => void {
  try {
    const q = query(
      collection(db, "scam_reports"),
      orderBy("reportedAt", "desc"),
      limit(maxReports)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const live: ScamReport[] = [];
        snap.forEach((d) => {
          live.push(d.data() as ScamReport);
        });
        callback(live);
      },
      (err) => {
        console.warn("Real-time scam reports error, falling back to one-time fetch:", err);
        fetchRecentScamReports(maxReports).then(callback);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Could not attach real-time listener:", err);
    fetchRecentScamReports(maxReports).then(callback);
    return () => {};
  }
}
