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

    let polarSubId: string | null = null;

    // 1. Try to find subscription in local DB first
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("payment_provider_sub_id, status, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("payment_provider", "polar")
      .single();

    if (sub?.payment_provider_sub_id) {
      polarSubId = sub.payment_provider_sub_id;
    }

    // 2. If no local record, find subscription from Polar API
    if (!polarSubId) {
      const polarSubs = await polar.subscriptions.list({
        externalCustomerId: user.id,
        active: true,
        limit: 1,
      });

      const activeSub = polarSubs.result?.items?.[0];
      if (activeSub) {
        polarSubId = activeSub.id;
      }
    }

    if (!polarSubId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // 3. Cancel at period end via Polar API
    const updatedSub = await polar.subscriptions.update({
      id: polarSubId,
      subscriptionUpdate: { cancelAtPeriodEnd: true },
    });

    // 4. Upsert local DB with the latest data from Polar
    const subscriptionData = {
      user_id: user.id,
      plan: "pro",
      status: "active",
      billing_cycle:
        updatedSub.recurringInterval === "year" ? "yearly" : "monthly",
      current_period_start: updatedSub.currentPeriodStart
        ? new Date(updatedSub.currentPeriodStart).toISOString()
        : null,
      current_period_end: updatedSub.currentPeriodEnd
        ? new Date(updatedSub.currentPeriodEnd).toISOString()
        : null,
      cancel_at_period_end: true,
      payment_provider: "polar",
      payment_provider_sub_id: polarSubId,
      amount: updatedSub.amount || 0,
      currency: updatedSub.currency?.toUpperCase() || "USD",
      updated_at: new Date().toISOString(),
    };

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("payment_provider", "polar")
      .single();

    if (existingSub) {
      await supabase
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingSub.id);
    } else {
      await supabase.from("subscriptions").insert(subscriptionData);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Cancel subscription error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to cancel subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
