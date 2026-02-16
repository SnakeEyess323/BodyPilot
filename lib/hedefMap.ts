import type { HedefProfil } from "./types";

/** Yeni onboarding hedef değerlerini mevcut API string'ine çevirir. */
export function hedefToApiValue(
  hedef: HedefProfil | undefined
): "kilo_verme" | "kas" | "dayaniklilik" | "genel_fitness" | undefined {
  if (!hedef) return undefined;
  const map: Record<HedefProfil, "kilo_verme" | "kas" | "dayaniklilik" | "genel_fitness"> = {
    yag_yakmak: "kilo_verme",
    kas_yapmak: "kas",
    sikilasmak: "dayaniklilik",
    kilo_almak: "genel_fitness",
    postur_duzeltmek: "genel_fitness",
    kondisyon_artirmak: "dayaniklilik",
    genel_saglikli_yasam: "genel_fitness",
    kilo_verme: "kilo_verme",
    kas: "kas",
    dayaniklilik: "dayaniklilik",
    genel_fitness: "genel_fitness",
  };
  return map[hedef];
}
