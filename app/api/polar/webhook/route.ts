import { NextRequest, NextResponse } from "next/server";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line
type SupabaseAdmin = any;

// Webhook'lar için Supabase admin client (RLS bypass)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase admin credentials not configured");
  }

  return createClient(url, serviceKey);
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("POLAR_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Webhook imza doğrulaması
  let event: ReturnType<typeof validateEvent>;
  try {
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    event = validateEvent(body, headers, webhookSecret);
  } catch (err: unknown) {
    if (err instanceof WebhookVerificationError) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }
    console.error("Webhook verification error:", err);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
    switch (event.type) {
      // Abonelik aktif olduğunda (yeni veya ödeme kurtarma)
      case "subscription.active": {
        await handleSubscriptionActive(supabaseAdmin, event.data);
        break;
      }

      // Abonelik oluşturulduğunda
      case "subscription.created": {
        await handleSubscriptionCreated(supabaseAdmin, event.data);
        break;
      }

      // Abonelik güncellendiğinde
      case "subscription.updated": {
        await handleSubscriptionUpdated(supabaseAdmin, event.data);
        break;
      }

      // Abonelik iptal edildiğinde
      case "subscription.canceled": {
        await handleSubscriptionCanceled(supabaseAdmin, event.data);
        break;
      }

      // Abonelik tamamen sonlandırıldığında
      case "subscription.revoked": {
        await handleSubscriptionRevoked(supabaseAdmin, event.data);
        break;
      }

      // İptal geri alındığında
      case "subscription.uncanceled": {
        await handleSubscriptionUncanceled(supabaseAdmin, event.data);
        break;
      }

      // Sipariş ödendiğinde
      case "order.paid": {
        console.log(`Order paid: ${event.data.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Polar subscription tipini tanımlayalım
interface PolarSubscription {
  id: string;
  customerId: string;
  productId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  recurringInterval: string;
  metadata: Record<string, unknown>;
}

// Metadata'dan Supabase user ID'yi bul
async function resolveUserId(
  supabase: SupabaseAdmin,
  subscription: PolarSubscription
): Promise<string | null> {
  // 1. Metadata'dan user ID al
  const userIdFromMeta = subscription.metadata?.supabase_user_id as
    | string
    | undefined;
  if (userIdFromMeta) return userIdFromMeta;

  // 2. Polar customer ID'den profili bul
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("polar_customer_id", subscription.customerId)
    .single();

  return profile?.id || null;
}

// Abonelik aktif olduğunda
async function handleSubscriptionActive(
  supabase: SupabaseAdmin,
  subscription: PolarSubscription
) {
  const userId = await resolveUserId(supabase, subscription);
  if (!userId) {
    console.error("No user found for subscription:", subscription.id);
    return;
  }

  // Polar customer ID'yi kaydet
  await supabase
    .from("profiles")
    .update({
      polar_customer_id: subscription.customerId,
      plan: "pro",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  // Abonelik kaydını güncelle
  await upsertSubscription(supabase, userId, subscription, "active");

  console.log(`Subscription active for user ${userId}`);
}

// Abonelik oluşturulduğunda
async function handleSubscriptionCreated(
  supabase: SupabaseAdmin,
  subscription: PolarSubscription
) {
  const userId = await resolveUserId(supabase, subscription);
  if (!userId) {
    console.error("No user found for subscription:", subscription.id);
    return;
  }

  // Polar customer ID'yi kaydet
  await supabase
    .from("profiles")
    .update({
      polar_customer_id: subscription.customerId,
      plan: "pro",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await upsertSubscription(supabase, userId, subscription, "active");

  console.log(`Subscription created for user ${userId}`);
}

// Abonelik güncellendiğinde
async function handleSubscriptionUpdated(
  supabase: SupabaseAdmin,
  subscription: PolarSubscription
) {
  const userId = await resolveUserId(supabase, subscription);
  if (!userId) {
    console.error("No user found for subscription:", subscription.id);
    return;
  }

  const status = mapPolarStatus(subscription.status);
  const isActive = status === "active";

  await supabase
    .from("profiles")
    .update({
      plan: isActive ? "pro" : "free",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await upsertSubscription(supabase, userId, subscription, status);

  console.log(
    `Subscription updated for user ${userId}: status=${subscription.status}`
  );
}

// Abonelik iptal edildiğinde
async function handleSubscriptionCanceled(
  supabase: SupabaseAdmin,
  subscription: PolarSubscription
) {
  const userId = await resolveUserId(supabase, subscription);
  if (!userId) {
    console.error("No user found for subscription:", subscription.id);
    return;
  }

  // cancel_at_period_end true ise dönem sonuna kadar aktif bırak
  if (subscription.cancelAtPeriodEnd) {
    await upsertSubscription(supabase, userId, subscription, "active");
  } else {
    await supabase
      .from("profiles")
      .update({
        plan: "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    await upsertSubscription(supabase, userId, subscription, "cancelled");
  }

  console.log(`Subscription canceled for user ${userId}`);
}

// Abonelik tamamen sonlandırıldığında
async function handleSubscriptionRevoked(
  supabase: SupabaseAdmin,
  subscription: PolarSubscription
) {
  const userId = await resolveUserId(supabase, subscription);
  if (!userId) {
    console.error("No user found for subscription:", subscription.id);
    return;
  }

  await supabase
    .from("profiles")
    .update({
      plan: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await upsertSubscription(supabase, userId, subscription, "cancelled");

  console.log(`Subscription revoked for user ${userId}`);
}

// İptal geri alındığında
async function handleSubscriptionUncanceled(
  supabase: SupabaseAdmin,
  subscription: PolarSubscription
) {
  const userId = await resolveUserId(supabase, subscription);
  if (!userId) {
    console.error("No user found for subscription:", subscription.id);
    return;
  }

  await supabase
    .from("profiles")
    .update({
      plan: "pro",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await upsertSubscription(supabase, userId, subscription, "active");

  console.log(`Subscription uncanceled for user ${userId}`);
}

// Abonelik kaydını oluştur veya güncelle
async function upsertSubscription(
  supabase: SupabaseAdmin,
  userId: string,
  subscription: PolarSubscription,
  status: "active" | "cancelled" | "expired" | "past_due"
) {
  const billingCycle =
    subscription.recurringInterval === "year" ? "yearly" : "monthly";

  const subscriptionData = {
    user_id: userId,
    plan: status === "active" ? "pro" : "free",
    status: status,
    billing_cycle: billingCycle,
    current_period_start: new Date(
      subscription.currentPeriodStart
    ).toISOString(),
    current_period_end: subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toISOString()
      : null,
    cancel_at_period_end: subscription.cancelAtPeriodEnd,
    payment_provider: "polar",
    payment_provider_sub_id: subscription.id,
    amount: subscription.amount,
    currency: subscription.currency?.toUpperCase() || "TRY",
    updated_at: new Date().toISOString(),
  };

  // Mevcut abonelik kaydı var mı kontrol et
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
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
}

// Polar status -> uygulama status eşlemesi
function mapPolarStatus(
  polarStatus: string
): "active" | "cancelled" | "expired" | "past_due" {
  switch (polarStatus) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
      return "cancelled";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "incomplete":
    case "incomplete_expired":
      return "expired";
    default:
      return "cancelled";
  }
}
