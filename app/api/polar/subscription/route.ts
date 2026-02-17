import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get profile plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    // Get subscription details
    const { data: sub } = await supabase
      .from("subscriptions")
      .select(
        "status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end, amount, currency"
      )
      .eq("user_id", user.id)
      .eq("payment_provider", "polar")
      .single();

    return NextResponse.json({
      plan: profile?.plan || "free",
      subscription: sub || null,
    });
  } catch (error: unknown) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
