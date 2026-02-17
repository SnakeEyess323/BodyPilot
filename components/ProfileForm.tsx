"use client";

import type { Profil, HedefProfil } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface ProfileFormProps {
  profil: Profil;
  onChange: (profil: Profil) => void;
  compact?: boolean;
}

export default function ProfileForm({ profil, onChange, compact }: ProfileFormProps) {
  const { t } = useLanguage();
  const p = t.profile;

  const update = (key: keyof Profil, value: unknown) => {
    onChange({ ...profil, [key]: value });
  };

  const inputClass = "w-full rounded border border-input bg-background px-3 py-2 text-foreground";
  const labelClass = "mb-1 block text-sm font-medium text-foreground";

  const goalOptions: { value: string; label: string }[] = [
    { value: "yag_yakmak", label: p.goalOptions.fatBurn },
    { value: "kas_yapmak", label: p.goalOptions.muscle },
    { value: "sikilasmak", label: p.goalOptions.toneUp },
    { value: "kilo_almak", label: p.goalOptions.weightGain },
    { value: "postur_duzeltmek", label: p.goalOptions.posture },
    { value: "kondisyon_artirmak", label: p.goalOptions.endurance },
    { value: "genel_saglikli_yasam", label: p.goalOptions.healthyLife },
  ];

  return (
    <div className={`space-y-4 ${compact ? "grid gap-4 sm:grid-cols-2" : ""}`}>
      <div className={compact ? "sm:col-span-2" : ""}>
        <label className={labelClass}>{p.fullName}</label>
        <input
          type="text"
          placeholder={p.fullNamePlaceholder}
          value={profil.adSoyad ?? ""}
          onChange={(e) => update("adSoyad", e.target.value || undefined)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{p.age}</label>
        <input
          type="number"
          min={10}
          max={100}
          value={profil.yas ?? ""}
          onChange={(e) => update("yas", e.target.value ? Number(e.target.value) : undefined)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{p.gender}</label>
        <select
          value={profil.cinsiyet ?? ""}
          onChange={(e) => update("cinsiyet", e.target.value || undefined)}
          className={inputClass}
        >
          <option value="">{p.select}</option>
          <option value="erkek">{p.genderOptions.male}</option>
          <option value="kadin">{p.genderOptions.female}</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>{p.weight}</label>
        <input
          type="number"
          min={30}
          max={300}
          step={0.1}
          value={profil.kilo ?? ""}
          onChange={(e) => update("kilo", e.target.value ? Number(e.target.value) : undefined)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{p.height}</label>
        <input
          type="number"
          min={100}
          max={250}
          value={profil.boy ?? ""}
          onChange={(e) => update("boy", e.target.value ? Number(e.target.value) : undefined)}
          className={inputClass}
        />
      </div>
      <div className={compact ? "sm:col-span-2" : ""}>
        <label className={labelClass}>{p.goalsMultiple}</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {goalOptions.map((option) => {
            const selected = Array.isArray(profil.hedef) && profil.hedef.includes(option.value as HedefProfil);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const current = Array.isArray(profil.hedef) ? [...profil.hedef] : [];
                  if (selected) {
                    const next = current.filter((h) => h !== option.value);
                    update("hedef", next.length > 0 ? next : undefined);
                  } else {
                    update("hedef", [...current, option.value]);
                  }
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className={labelClass}>{p.level}</label>
        <select
          value={profil.seviye ?? ""}
          onChange={(e) => update("seviye", e.target.value || undefined)}
          className={inputClass}
        >
          <option value="">{p.select}</option>
          <option value="baslangic">{p.levelOptions.beginner}</option>
          <option value="orta">{p.levelOptions.intermediate}</option>
          <option value="ileri">{p.levelOptions.advanced}</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>{p.weeklyDays}</label>
        <select
          value={profil.gunSayisi ?? ""}
          onChange={(e) => update("gunSayisi", e.target.value || undefined)}
          className={inputClass}
        >
          <option value="">{p.select}</option>
          <option value="1">1 {p.dayCount}</option>
          <option value="2">2 {p.dayCount}</option>
          <option value="3">3 {p.dayCount}</option>
          <option value="4">4 {p.dayCount}</option>
          <option value="5">5 {p.dayCount}</option>
          <option value="6">6 {p.dayCount}</option>
          <option value="7">{p.everyday}</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>{p.environment}</label>
        <select
          value={profil.ortam ?? ""}
          onChange={(e) => update("ortam", e.target.value || undefined)}
          className={inputClass}
        >
          <option value="">{p.select}</option>
          <option value="ev">{p.environmentOptions.home}</option>
          <option value="salon">{p.environmentOptions.gym}</option>
        </select>
      </div>
      <div className={compact ? "sm:col-span-2" : ""}>
        <label className={labelClass}>{p.dietaryRestrictions}</label>
        <input
          type="text"
          placeholder={p.dietaryRestrictionsPlaceholder}
          value={profil.kisitlar ?? ""}
          onChange={(e) => update("kisitlar", e.target.value.trim() || undefined)}
          className={inputClass}
        />
      </div>
    </div>
  );
}
