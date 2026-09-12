"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import { QrCode as QrCodeIcon, ScanLine } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function GuardianQrCode({ url }: { url: string }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;
    QRCode.toDataURL(url, { width: 240, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then((data) => {
        if (!cancelled) setDataUrl(data);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-xs ring-1 ring-slate-300 hover:bg-slate-50 transition-all"
      >
        <QrCodeIcon className="h-4 w-4 text-indigo-600" />
        <span>{open ? t("qrHideLabel") : t("qrShowLabel")}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              {dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dataUrl} alt="Guardian link QR code" width={200} height={200} className="rounded-lg" />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <ScanLine className="h-8 w-8 animate-pulse" />
                </div>
              )}
              <p className={`flex items-center gap-1.5 text-xs font-bold text-slate-600 ${lang === "ur" ? "font-urdu text-sm" : ""}`}>
                <ScanLine className="h-3.5 w-3.5 text-indigo-500" />
                {t("qrScanInstruction")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
