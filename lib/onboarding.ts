import type { Profil } from "@/lib/types";

/**
 * Onboarding tamamlandı mı?
 * Sadece bir kez gösterilir: kullanıcı onboarding'i bitirdikten sonra
 * `onboardingCompleted` bayrağı `true` olarak kaydedilir.
 */
export function profilTamamlandi(profil: Profil): boolean {
  return profil.onboardingCompleted === true;
}
