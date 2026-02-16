import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar } from "@/lib/polar/server";
import { getProductId, type BillingCycle } from "@/lib/polar/config";
import { POLAR_CONFIG } from "@/lib/polar/config";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    // Kullanıcı doğrulama
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 }
      );
    }

    // Request body'den billing cycle al
    const body = await req.json();
    const billingCycle: BillingCycle = body.billingCycle || "monthly";

    const productId = getProductId(billingCycle);
    if (!productId) {
      return NextResponse.json(
        { error: "Ürün yapılandırması bulunamadı" },
        { status: 500 }
      );
    }

    // Kullanıcının profil bilgilerini al
    const { data: profile } = await supabase
      .from("profiles")
      .select("polar_customer_id, email, full_name")
      .eq("id", user.id)
      .single();

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Polar Checkout Session oluştur
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${origin}${POLAR_CONFIG.urls.success}?checkout_id={CHECKOUT_ID}`,
      customerEmail: user.email || profile?.email || undefined,
      customerName: profile?.full_name || undefined,
      // Supabase user ID'yi external customer ID olarak kullan
      // Bu sayede Polar webhook'larında kullanıcıyı eşleştirebiliriz
      externalCustomerId: user.id,
      allowDiscountCodes: true,
      metadata: {
        supabase_user_id: user.id,
        billing_cycle: billingCycle,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error: unknown) {
    console.error("Polar checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Ödeme işlemi başlatılamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
