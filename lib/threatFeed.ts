import type { Lang } from "./types";

// Illustrative awareness content for the home-screen ticker — NOT a live feed
// of verified statistics. Framed as community/awareness reporting rather
// than certified figures, consistent with ScamWatch never asserting false
// precision (see PRD §14.1's "never a confidence percentage" principle).
export const THREAT_FEED: Record<Lang, string[]> = {
  en: [
    "🔴 Community reports: fake BISP / 8171 payment messages circulating today",
    "🔴 Easypaisa \"biometric verification\" APK scam reported in multiple cities",
    "🔴 Fake job offers asking for a \"registration fee\" before any interview",
    "🔴 Callers impersonating bank officers asking for OTP codes",
    "🔴 \"Beta, phone kharab hai\" voice-clone emergency calls on the rise",
    "🔴 Fake courier/parcel SMS links asking for card details",
  ],
  ur: [
    "🔴 کمیونٹی رپورٹس: آج جعلی بی آئی ایس پی / 8171 پیغامات گردش میں ہیں",
    "🔴 ایزی پیسہ \"بائیومیٹرک تصدیق\" اے پی کے فراڈ کئی شہروں میں رپورٹ ہوا",
    "🔴 جعلی نوکری کی آفرز جن میں انٹرویو سے پہلے \"رجسٹریشن فیس\" مانگی جاتی ہے",
    "🔴 بینک اہلکار بن کر او ٹی پی کوڈ مانگنے والی کالز",
    "🔴 \"بیٹا، فون خراب ہے\" جیسی جعلی ایمرجنسی کالز میں اضافہ",
    "🔴 جعلی کوریئر/پارسل ایس ایم ایس لنکس جو کارڈ کی تفصیلات مانگتے ہیں",
  ],
  "roman-ur": [
    "🔴 Community reports: aaj jaali BISP / 8171 payment messages gardish mein hain",
    "🔴 Easypaisa \"biometric verification\" APK scam kai shehron mein report hua",
    "🔴 Jaali job offers jinmein interview se pehle \"registration fee\" maangi jati hai",
    "🔴 Bank officer ban kar OTP code maangne wali calls",
    "🔴 \"Beta, phone kharab hai\" jaisi jaali emergency calls mein izafa",
    "🔴 Jaali courier/parcel SMS links jo card details maangte hain",
  ],
};
