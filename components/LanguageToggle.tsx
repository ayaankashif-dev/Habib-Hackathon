"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const OPTIONS: { value: Lang; label: string; native?: string }[] = [
  { value: "roman-ur", label: "Roman" },
  { value: "ur", label: "اردو" },
  { value: "en", label: "English" },
];

export default function LanguageToggle() {
  const { lang, setLang, t } = useLang();

  return (
    <nav aria-label={t("languageLabel")} className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 sm:gap-1 rounded-full glass-panel-subtle p-1 shadow-sm ring-1 ring-slate-200/80">
        {/* Hidden below sm: three full labels + icon don't fit a ~390px phone
            screen without pushing the whole page into horizontal overflow. */}
        <div className="hidden sm:flex items-center justify-center pl-2 pr-1 text-slate-400">
          <Globe className="h-3.5 w-3.5" aria-hidden />
        </div>
        {OPTIONS.map((opt) => {
          const active = lang === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLang(opt.value)}
              aria-pressed={active}
              className={`relative z-10 flex min-h-[38px] items-center rounded-full px-2 py-1 text-[11px] font-semibold transition-colors sm:px-3.5 sm:text-sm ${
                active ? "text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              } ${opt.value === "ur" ? "font-urdu text-sm pt-0.5" : ""}`}
            >
              {active && (
                <motion.span
                  layoutId="active-lang-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-slate-900 shadow-md"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

