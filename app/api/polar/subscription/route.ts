import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar } from "@/lib/polar/server";

async function findPolarSubscription(userId: string, email: string | undefined, polarCustomerId: string | null) {
  // Try externalCustomerId first
  try {
    const page = await polar.subscriptions.list({
      externalCustomerId: userId,
      active: true,
      limit: 5,
    });
    const items = page.result?.items || [];
    if (items.length > 0) return items[0];
  } catch {
    // continue
  }

  // Try polar_customer_id
  if (polarCustomerId) {
    try {
      const page = await polar.subscriptions.list({
        customerId: polarCustomerId,
        active: true,
        limit: 5,
      });
      const items = page.result?.items || [];
      if (items.length > 0) return items[0];
    } catch {
      // continue
    }
  }

  // Try by email
  if (email) {
    try {
      const customers = await polar.customers.list({
        email,
        limit: 5,
      });
      const customerItems = customers.result?.items || [];
      for (const customer of customerItems) {
        const page = await polar.subscriptions.list({
          customerId: customer.id,
          active: true,
          limit: 5,
        });
        const subItems = page.result?.items || [];
        if (subItems.length > 0) return subItems[0];
      }
    } catch {
      // continue
    }
  }

  return null;
}

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

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, polar_customer_id")
      .eq("id", user.id)
      .single();

    // Get subscription details from local DB
    const { data: sub } = await supabase
      .from("subscriptions")
      .select(
        "status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end, amount, currency"
      )
      .eq("user_id", user.id)
      .eq("payment_provider", "polar")
      .single();

    // If we have local data, return it
    if (sub) {
      return NextResponse.json({
        plan: profile?.plan || "free",
        subscription: sub,
      });
    }

    // If no local record, try to fetch from Polar API
    try {
      const activeSub = await findPolarSubscription(
        user.id,
        user.email || undefined,
        profile?.polar_customer_id || null
      );

      if (activeSub) {
        const billingCycle =
          activeSub.recurringInterval === "year" ? "yearly" : "monthly";

        const subscriptionData = {
          user_id: user.id,
          plan: "pro",
          status: "active",
          billing_cycle: billingCycle,
          current_period_start: activeSub.currentPeriodStart
            ? new Date(activeSub.currentPeriodStart).toISOString()
            : null,
          current_period_end: activeSub.currentPeriodEnd
            ? new Date(activeSub.currentPeriodEnd).toISOString()
            : null,
          cancel_at_period_end: activeSub.cancelAtPeriodEnd || false,
          payment_provider: "polar",
          payment_provider_sub_id: activeSub.id,
          amount: activeSub.amount || 0,
          currency: activeSub.currency?.toUpperCase() || "USD",
          updated_at: new Date().toISOString(),
        };

        // Sync to local DB
        await supabase.from("subscriptions").insert(subscriptionData);

        // Ensure profile plan is pro
        if (profile?.plan !== "pro") {
          await supabase
            .from("profiles")
            .update({ plan: "pro", updated_at: new Date().toISOString() })
            .eq("id", user.id);
        }

        // Save polar_customer_id if not set
        if (!profile?.polar_customer_id && activeSub.customerId) {
          await supabase
            .from("profiles")
            .update({
              polar_customer_id: activeSub.customerId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        }

        return NextResponse.json({
          plan: "pro",
          subscription: {
            status: "active",
            billing_cycle: billingCycle,
            current_period_start: activeSub.currentPeriodStart
              ? new Date(activeSub.currentPeriodStart).toISOString()
              : null,
            current_period_end: activeSub.currentPeriodEnd
              ? new Date(activeSub.currentPeriodEnd).toISOString()
              : null,
            cancel_at_period_end: activeSub.cancelAtPeriodEnd || false,
            amount: activeSub.amount || 0,
            currency: activeSub.currency?.toUpperCase() || "USD",
          },
        });
      }
    } catch (polarError) {
      console.error("Polar API fetch error:", polarError);
    }

    // No subscription found anywhere
    return NextResponse.json({
      plan: profile?.plan || "free",
      subscription: null,
    });
  } catch (error: unknown) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
