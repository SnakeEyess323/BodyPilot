"use client";

import { ProfilProvider as Provider } from "@/context/ProfilContext";

export default function ProfilProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider>{children}</Provider>;
}
