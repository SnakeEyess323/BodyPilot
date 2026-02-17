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
    const debugInfo: string[] = [];

    // 1. Try local DB first
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("payment_provider_sub_id, status, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("payment_provider", "polar")
      .single();

    if (subError) {
      debugInfo.push(`DB lookup: ${subError.message}`);
    }

    if (sub?.payment_provider_sub_id) {
      polarSubId = sub.payment_provider_sub_id;
      debugInfo.push(`Found sub in DB: ${polarSubId}`);
    }

    // 2. If no local record, try Polar API with externalCustomerId
    if (!polarSubId) {
      try {
        debugInfo.push(`Trying Polar API with externalCustomerId: ${user.id}`);
        const page = await polar.subscriptions.list({
          externalCustomerId: user.id,
          active: true,
          limit: 10,
        });
        const items = page.result?.items || [];
        debugInfo.push(`Polar externalCustomerId results: ${items.length}`);
        if (items.length > 0) {
          polarSubId = items[0].id;
          debugInfo.push(`Found sub via externalCustomerId: ${polarSubId}`);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        debugInfo.push(`Polar externalCustomerId error: ${msg}`);
      }
    }

    // 3. Try via polar_customer_id from profiles
    if (!polarSubId) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("polar_customer_id")
          .eq("id", user.id)
          .single();

        if (profile?.polar_customer_id) {
          debugInfo.push(
            `Trying Polar API with customerId: ${profile.polar_customer_id}`
          );
          const page = await polar.subscriptions.list({
            customerId: profile.polar_customer_id,
            active: true,
            limit: 10,
          });
          const items = page.result?.items || [];
          debugInfo.push(`Polar customerId results: ${items.length}`);
          if (items.length > 0) {
            polarSubId = items[0].id;
            debugInfo.push(`Found sub via customerId: ${polarSubId}`);
          }
        } else {
          debugInfo.push("No polar_customer_id in profile");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        debugInfo.push(`Polar customerId error: ${msg}`);
      }
    }

    // 4. Try via customer email lookup
    if (!polarSubId && user.email) {
      try {
        debugInfo.push(`Trying Polar customers by email: ${user.email}`);
        const customers = await polar.customers.list({
          email: user.email,
          limit: 5,
        });
        const customerItems = customers.result?.items || [];
        debugInfo.push(`Found ${customerItems.length} customers by email`);

        for (const customer of customerItems) {
          const page = await polar.subscriptions.list({
            customerId: customer.id,
            active: true,
            limit: 5,
          });
          const subItems = page.result?.items || [];
          if (subItems.length > 0) {
            polarSubId = subItems[0].id;
            debugInfo.push(
              `Found sub via email customer ${customer.id}: ${polarSubId}`
            );
            break;
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        debugInfo.push(`Polar email lookup error: ${msg}`);
      }
    }

    if (!polarSubId) {
      console.error("Cancel: no subscription found.", debugInfo.join(" | "));
      return NextResponse.json(
        {
          error: "No active subscription found",
          debug: debugInfo,
        },
        { status: 404 }
      );
    }

    // Cancel at period end via Polar API
    debugInfo.push(`Cancelling subscription: ${polarSubId}`);
    const updatedSub = await polar.subscriptions.update({
      id: polarSubId,
      subscriptionUpdate: { cancelAtPeriodEnd: true },
    });
    debugInfo.push("Polar update success");

    // Upsert local DB
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

    return NextResponse.json({ success: true, debug: debugInfo });
  } catch (error: unknown) {
    console.error("Cancel subscription error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to cancel subscription";
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { error: message, stack },
      { status: 500 }
    );
  }
}
