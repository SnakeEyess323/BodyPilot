import type { GunAdi, HaftalikProgram } from "@/lib/types";
import type { Event } from "@/components/ui/event-manager";
import { GUN_SIRASI } from "@/lib/parseProgram";

/** JS getDay(): 0=Pazar, 1=Pazartesi, ... 6=Cumartesi. GUN_SIRASI[0]=Pazartesi. */
const JS_DAY_INDEX_TO_GUN: GunAdi[] = [
  "Pazar",     // 0
  "Pazartesi", // 1
  "Salı",      // 2
  "Çarşamba",  // 3
  "Perşembe",  // 4
  "Cuma",      // 5
  "Cumartesi", // 6
];

export function eventStartToGun(date: Date): GunAdi {
  return JS_DAY_INDEX_TO_GUN[date.getDay()];
}

/** Haftalık programı, verilen haftanın Pazartesi gününden başlayarak Event[] listesine çevirir. */
export function programToEvents(program: HaftalikProgram, weekStart: Date): Event[] {
  const events: Event[] = [];
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const dayOfWeek = start.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(start);
  monday.setDate(start.getDate() + mondayOffset);

  for (let i = 0; i < 7; i++) {
    const gun = GUN_SIRASI[i];
    const content = (program[gun] ?? "").trim();
    if (!content) continue;
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const startTime = new Date(dayDate);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(dayDate);
    endTime.setHours(10, 0, 0, 0);
    const firstLine = content.split("\n")[0]?.trim().slice(0, 50) || "Antrenman";
    events.push({
      id: `antrenman-${gun}`,
      title: firstLine,
      description: content,
      startTime,
      endTime,
      color: "purple",
      category: "Antrenman",
      tags: ["Antrenman"],
    });
  }
  return events;
}

/** Bir etkinliğin tarihine göre haftalık programdaki günü günceller. */
export function eventToProgramDay(event: Event): { gun: GunAdi; content: string } {
  const gun = eventStartToGun(event.startTime);
  const content = (event.description ?? event.title ?? "").trim();
  return { gun, content };
}
