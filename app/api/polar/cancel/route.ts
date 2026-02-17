import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar } from "@/lib/polar/server";

export async function POST(req: NextRequest) {
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

    // Get user's subscription from DB
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("payment_provider_sub_id, status, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("payment_provider", "polar")
      .single();

    if (!sub?.payment_provider_sub_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    if (sub.status !== "active") {
      return NextResponse.json(
        { error: "Subscription is not active" },
        { status: 400 }
      );
    }

    // Cancel at period end via Polar API
    await polar.subscriptions.update({
      id: sub.payment_provider_sub_id,
      subscriptionUpdate: { cancelAtPeriodEnd: true },
    });

    // Update local DB
    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("payment_provider", "polar");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Cancel subscription error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to cancel subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
