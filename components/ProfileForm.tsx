"use client";

import type { Profil, HedefProfil } from "@/lib/types";

interface ProfileFormProps {
  profil: Profil;
  onChange: (profil: Profil) => void;
  compact?: boolean;
}

export default function ProfileForm({ profil, onChange, compact }: ProfileFormProps) {
  const update = (key: keyof Profil, value: unknown) => {
    onChange({ ...profil, [key]: value });
  };

  const inputClass = "w-full rounded border border-input bg-background px-3 py-2 text-foreground";
  const labelClass = "mb-1 block text-sm font-medium text-foreground";

  return (
    <div className={`space-y-4 ${compact ? "grid gap-4 sm:grid-cols-2" : ""}`}>
      <div className={compact ? "sm:col-span-2" : ""}>
        <label className={labelClass}>Ad Soyad</label>
        <input
          type="text"
          placeholder="Adınız ve soyadınız"
          value={profil.adSoyad ?? ""}
          onChange={(e) => update("adSoyad", e.target.value || undefined)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Yaş</label>
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
        <label className={labelClass}>Cinsiyet</label>
        <select
          value={profil.cinsiyet ?? ""}
          onChange={(e) => update("cinsiyet", e.target.value || undefined)}
          className={inputClass}
        >
          <option value="">Seçin</option>
          <option value="erkek">Erkek</option>
          <option value="kadin">Kadın</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Kilo (kg)</label>
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
        <label className={labelClass}>Boy (cm)</label>
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
        <label className={labelClass}>Hedefler (birden fazla seçebilirsiniz)</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {[
            { value: "yag_yakmak", label: "Yağ yakmak" },
            { value: "kas_yapmak", label: "Kas yapmak" },
            { value: "sikilasmak", label: "Sıkılaşmak" },
            { value: "kilo_almak", label: "Kilo almak" },
            { value: "postur_duzeltmek", label: "Postür düzeltmek" },
            { value: "kondisyon_artirmak", label: "Kondisyon artırmak" },
            { value: "genel_saglikli_yasam", label: "Genel sağlıklı yaşam" },
          ].map((option) => {
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
        <label className={labelClass}>Seviye</label>
        <select
          value={profil.seviye ?? ""}
          onChange={(e) => update("seviye", e.target.value || undefined)}
          className={inputClass}
        >
          <option value="">Seçin</option>
          <option value="baslangic">Başlangıç</option>
          <option value="orta">Orta</option>
          <option value="ileri">İleri</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Haftalık antrenman günü</label>
        <select
          value={profil.gunSayisi ?? ""}
          onChange={(e) => update("gunSayisi", e.target.value || undefined)}
          className={inputClass}
        >
          <option value="">Seçin</option>
          <option value="1">1 gün</option>
          <option value="2">2 gün</option>
          <option value="3">3 gün</option>
          <option value="4">4 gün</option>
          <option value="5">5 gün</option>
          <option value="6">6 gün</option>
          <option value="7">Hergün</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Ortam</label>
        <select
          value={profil.ortam ?? ""}
          onChange={(e) => update("ortam", e.target.value || undefined)}
          className={inputClass}
        >
          <option value="">Seçin</option>
          <option value="ev">Ev</option>
          <option value="salon">Salon</option>
        </select>
      </div>
      <div className={compact ? "sm:col-span-2" : ""}>
        <label className={labelClass}>Beslenme kısıtları / alerjiler</label>
        <input
          type="text"
          placeholder="Örn: vejetaryen, glutensiz, süt alerjisi"
          value={profil.kisitlar ?? ""}
          onChange={(e) => update("kisitlar", e.target.value.trim() || undefined)}
          className={inputClass}
        />
      </div>
    </div>
  );
}
