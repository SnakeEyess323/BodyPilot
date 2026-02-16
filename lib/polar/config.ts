// Polar fiyatlandırma yapılandırması
// Bu Product ID'leri Polar Dashboard'dan alınmıştır

export const POLAR_CONFIG = {
  // Polar Dashboard > Products bölümünden alınan ID'ler
  products: {
    pro_monthly: process.env.POLAR_PRODUCT_PRO_MONTHLY || "",
    pro_yearly: process.env.POLAR_PRODUCT_PRO_YEARLY || "",
  },

  // Ödeme sonrası yönlendirme URL'leri
  urls: {
    success: "/odeme/basarili",
    cancel: "/odeme/iptal",
    portal_return: "/profil",
  },

  // Para birimi
  currency: "TRY",
} as const;

export type BillingCycle = "monthly" | "yearly";

export function getProductId(cycle: BillingCycle): string {
  return cycle === "yearly"
    ? POLAR_CONFIG.products.pro_yearly
    : POLAR_CONFIG.products.pro_monthly;
}
