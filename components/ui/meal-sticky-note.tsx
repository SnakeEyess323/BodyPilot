"use client";

import { useState, useMemo } from "react";
import { Heart, Trash2, Calendar, ChevronDown, Check } from "lucide-react";
import type { OgunTipi, YemekItem } from "@/lib/parseYemekProgram";
import { useFavoriYemek } from "@/context/FavoriYemekContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { GunAdi } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface MealStickyNoteProps {
  item: YemekItem;
  className?: string;
  onDelete?: (id: string) => void;
  onAddToCalendar?: (item: YemekItem, gun: GunAdi) => void;
  onSelect?: (item: YemekItem) => void;
  isSelected?: boolean;
}

const OGUN_COLORS: Record<OgunTipi, { bg: string; border: string; header: string; accent: string }> = {
  kahvalti: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800",
    header: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
    accent: "bg-amber-500",
  },
  ogle: {
    bg: "bg-orange-50 dark:bg-orange-950/50",
    border: "border-orange-200 dark:border-orange-800",
    header: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
    accent: "bg-orange-500",
  },
  aksam: {
    bg: "bg-purple-50 dark:bg-purple-950/50",
    border: "border-purple-200 dark:border-purple-800",
    header: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
    accent: "bg-purple-500",
  },
  ara: {
    bg: "bg-teal-50 dark:bg-teal-950/50",
    border: "border-teal-200 dark:border-teal-800",
    header: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200",
    accent: "bg-teal-500",
  },
};

export function MealStickyNote({ item, className, onDelete, onAddToCalendar, onSelect, isSelected }: MealStickyNoteProps) {
  const { t } = useLanguage();
  const { isFavori, toggleFavori } = useFavoriYemek();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const favori = isFavori(item.id);
  const colors = OGUN_COLORS[item.ogun];
  
  const ogunLabels: Record<OgunTipi, string> = useMemo(() => ({
    kahvalti: t.meals.breakfast,
    ogle: t.meals.lunch,
    aksam: t.meals.dinner,
    ara: t.meals.snack,
  }), [t]);
  
  const gunler: GunAdi[] = useMemo(() => [
    t.meals.days.monday as GunAdi,
    t.meals.days.tuesday as GunAdi,
    t.meals.days.wednesday as GunAdi,
    t.meals.days.thursday as GunAdi,
    t.meals.days.friday as GunAdi,
    t.meals.days.saturday as GunAdi,
    t.meals.days.sunday as GunAdi,
  ], [t]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Butonlara tıklanınca modal açılmasın
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDetailOpen(true);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          "relative rounded-lg border-2 p-3 shadow-sm transition-all duration-200 cursor-pointer",
          "hover:shadow-md hover:-translate-y-0.5",
          isSelected
            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
            : `${colors.bg} ${colors.border}`,
          className
        )}
      >
        {/* Seçili badge */}
        {isSelected && (
          <div className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Check className="h-3 w-3" />
          </div>
        )}

        {/* Aksiyon butonları - sağ üst */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavori(item.id);
            }}
            className={cn(
              "p-1 rounded-full transition-all duration-200",
              favori
                ? "text-red-500 hover:text-red-600"
                : "text-muted-foreground/40 hover:text-red-400"
            )}
            aria-label={favori ? t.extra.removeFromFavorites : t.extra.addToFavorites}
          >
            <Heart className={cn("w-3.5 h-3.5", favori && "fill-current")} />
          </button>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-1 rounded-full text-muted-foreground/40 hover:text-red-500 transition-colors"
              aria-label="Sil"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Yemek başlığı - tam okunabilir */}
        <h4 className="font-semibold text-foreground pr-14 line-clamp-2 leading-snug">
          {item.baslik}
        </h4>

        {/* Kalori bilgisi */}
        {item.kalori && (
          <span className={cn(
            "inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
            colors.header
          )}>
            🔥 {item.kalori}
          </span>
        )}

        {/* Seç butonu */}
        {onSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className={cn(
              "mt-2 w-full rounded-lg py-1.5 text-xs font-medium transition-all",
              isSelected
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-card/80 text-foreground hover:bg-primary/10 hover:text-primary border border-border"
            )}
          >
            {isSelected ? `✓ ${t.meals.selected}` : t.meals.selectToday}
          </button>
        )}
      </div>

      {/* Detay Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className={cn("w-3 h-3 rounded-full", colors.accent)} />
              <span className="text-xs text-muted-foreground">{ogunLabels[item.ogun]}</span>
            </div>
            <DialogTitle className="text-xl">{item.baslik}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Malzemeler */}
            {item.malzemeler && (
              <div className={cn("p-3 rounded-lg", colors.bg)}>
                <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                  🥗 {t.meals.ingredients}
                </h4>
                <p className="text-foreground/80 text-sm">{item.malzemeler}</p>
              </div>
            )}

            {/* Tarif */}
            {item.tarif && (
              <div className="p-3 rounded-lg bg-muted">
                <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                  👨‍🍳 {t.meals.recipe}
                </h4>
                <p className="text-foreground/80 text-sm whitespace-pre-line">{item.tarif}</p>
              </div>
            )}

            {/* Besin değerleri */}
            <div className="flex flex-wrap gap-3">
              {item.kalori && (
                <div className={cn("px-4 py-2 rounded-lg", colors.bg)}>
                  <p className="text-xs text-muted-foreground">🔥 {t.meals.calories}</p>
                  <p className="font-semibold text-foreground">{item.kalori}</p>
                </div>
              )}
              {item.makrolar && (
                <div className="px-4 py-2 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">📊 {t.meals.macros}</p>
                  <p className="font-semibold text-foreground">{item.makrolar}</p>
                </div>
              )}
            </div>

            {/* Aksiyonlar */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
              {/* Bugün bunu ye butonu */}
              {onSelect && (
                <Button
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => {
                    onSelect(item);
                    setIsDetailOpen(false);
                  }}
                  className={cn(
                    "flex-1 gap-2",
                    isSelected && "bg-primary hover:bg-primary/90"
                  )}
                >
                  <Check className="w-4 h-4" />
                  {isSelected ? t.meals.selected : t.meals.selectToday}
                </Button>
              )}

              {/* Takvime ekle */}
              {onAddToCalendar && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      {t.meals.addToCalendar}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {gunler.map((gun) => (
                      <DropdownMenuItem
                        key={gun}
                        onClick={() => {
                          onAddToCalendar(item, gun);
                          setIsDetailOpen(false);
                        }}
                      >
                        {gun}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Favori toggle */}
              <Button
                variant={favori ? "default" : "outline"}
                onClick={() => toggleFavori(item.id)}
                className={cn("gap-2", favori && "bg-red-500 hover:bg-red-600")}
              >
                <Heart className={cn("w-4 h-4", favori && "fill-current")} />
                {favori ? t.meals.favorited : t.meals.favorite}
              </Button>

              {/* Sil */}
              {onDelete && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onDelete(item.id);
                    setIsDetailOpen(false);
                  }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MealSectionProps {
  title: string;
  items: YemekItem[];
  ogun: OgunTipi;
  onDelete?: (id: string) => void;
  onAddToCalendar?: (item: YemekItem, gun: GunAdi) => void;
  onSelect?: (item: YemekItem) => void;
  selectedId?: string | null;
}

const OGUN_ICONS: Record<OgunTipi, string> = {
  kahvalti: "🌅",
  ogle: "☀️",
  aksam: "🌙",
  ara: "🍎",
};

export function MealSection({ title, items, ogun, onDelete, onAddToCalendar, onSelect, selectedId }: MealSectionProps) {
  const { t } = useLanguage();
  const colors = OGUN_COLORS[ogun];
  
  const ogunTitles: Record<OgunTipi, string> = useMemo(() => ({
    kahvalti: t.meals.breakfast,
    ogle: t.meals.lunch,
    aksam: t.meals.dinner,
    ara: t.meals.snacks,
  }), [t]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm",
        colors.header
      )}>
        <span>{OGUN_ICONS[ogun]}</span>
        {title}
        <span className="text-xs opacity-70">({items.length})</span>
      </h3>
      <div className="grid gap-2">
        {items.map((item) => (
          <MealStickyNote
            key={item.id}
            item={item}
            onDelete={onDelete}
            onAddToCalendar={onAddToCalendar}
            onSelect={onSelect}
            isSelected={selectedId === item.id}
          />
        ))}
      </div>
    </div>
  );
}

export { OGUN_COLORS };

// Hook to get translated meal titles
export function useOgunTitles() {
  const { t } = useLanguage();
  return useMemo(() => ({
    kahvalti: t.meals.breakfast,
    ogle: t.meals.lunch,
    aksam: t.meals.dinner,
    ara: t.meals.snacks,
  }), [t]);
}
