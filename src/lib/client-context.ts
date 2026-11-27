export interface ClientSystemContext {
  timeZone: string;
  formattedDateTime: string;
  dayOfWeek: string;
  isoDate: string;
  deviceOS?: string;
  browser?: string;
}

export function detectDeviceOS(userAgent: string): string {
  if (!userAgent) return "Perangkat Tidak Teridentifikasi";
  if (/windows nt 10/i.test(userAgent)) return "Windows 10/11";
  if (/windows nt 6\.3/i.test(userAgent)) return "Windows 8.1";
  if (/windows nt 6\.1/i.test(userAgent)) return "Windows 7";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "macOS";
  if (/iphone/i.test(userAgent)) return "iOS (iPhone)";
  if (/ipad/i.test(userAgent)) return "iPadOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Perangkat Desktop/Mobile";
}

export function detectBrowser(userAgent: string): string {
  if (!userAgent) return "Klien Web";
  if (/edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/chrome|crios/i.test(userAgent) && !/edg\//i.test(userAgent)) return "Google Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Mozilla Firefox";
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return "Apple Safari";
  return "Browser Web";
}

export function getClientSystemContext(fallbackUserAgent?: string): ClientSystemContext {
  const isBrowser = typeof window !== "undefined" && typeof navigator !== "undefined";
  const now = new Date();

  let timeZone = "Asia/Jakarta";
  try {
    if (isBrowser) {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
    }
  } catch {
    timeZone = "Asia/Jakarta";
  }

  let formattedDateTime = "";
  let dayOfWeek = "";

  try {
    formattedDateTime = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone,
    }).format(now);

    dayOfWeek = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      timeZone,
    }).format(now);
  } catch {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    dayOfWeek = days[now.getDay()];
    formattedDateTime = `${dayOfWeek}, ${now.toLocaleDateString("id-ID")}`;
  }

  const userAgent = isBrowser ? navigator.userAgent : fallbackUserAgent || "";

  return {
    timeZone,
    formattedDateTime,
    dayOfWeek,
    isoDate: now.toISOString(),
    deviceOS: userAgent ? detectDeviceOS(userAgent) : undefined,
    browser: userAgent ? detectBrowser(userAgent) : undefined,
  };
}
