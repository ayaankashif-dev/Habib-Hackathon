export interface GuardianProfile {
  name: string;
  /** Digits only, with country code, e.g. "923001234567" — the format wa.me/api.whatsapp.com expects. */
  whatsapp: string;
}

const STORAGE_KEY = "saathi:guardianProfile";

/** Normalizes common Pakistani phone formats (0300..., +92300..., 92300...) to a bare "92XXXXXXXXXX". */
export function normalizePakPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return `92${digits}`;
}

export function saveGuardianProfile(input: { name: string; whatsapp: string }): GuardianProfile {
  const profile: GuardianProfile = {
    name: input.name.trim(),
    whatsapp: normalizePakPhone(input.whatsapp),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
  return profile;
}

export function loadGuardianProfile(): GuardianProfile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuardianProfile;
    return parsed.name && parsed.whatsapp ? parsed : null;
  } catch {
    return null;
  }
}

export function clearGuardianProfile() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function buildWhatsAppLink(phone: string, text: string): string {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}
