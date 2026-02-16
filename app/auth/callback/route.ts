import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user has completed onboarding by looking at user_data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("user_data")
          .select("value")
          .eq("user_id", user.id)
          .eq("key", "spor-asistan-profil")
          .single();

        const profil = profileData?.value;
        if (profil && typeof profil === "object" && (profil as Record<string, unknown>).onboardingCompleted === true) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }

      // New user or onboarding not completed → go to onboarding
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/giris?error=auth_callback_error`);
}
