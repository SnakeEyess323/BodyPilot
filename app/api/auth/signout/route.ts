import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ success: true });

  // Clear all Supabase auth cookies
  const cookieNames = [
    "sb-access-token",
    "sb-refresh-token",
    `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`,
  ];

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      path: "/",
    });
  }

  return response;
}
