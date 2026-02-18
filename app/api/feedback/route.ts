import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY = 5 * 1024; // 5KB limit

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) {
      return NextResponse.json({ error: "Request too large." }, { status: 400 });
    }

    const body = JSON.parse(raw);
    const { name, email, category, message } = body as {
      name: string;
      email: string;
      category: string;
      message: string;
    };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ error: "Message too short." }, { status: 400 });
    }

    if (message.trim().length > 2000) {
      return NextResponse.json({ error: "Message too long." }, { status: 400 });
    }

    const validCategories = ["bug", "suggestion", "question", "ux", "general"];
    const cat = validCategories.includes(category) ? category : "general";

    const supabase = createClient();

    // Try to get the current user (optional - works for both logged-in and anonymous)
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Anonymous user
    }

    const { error } = await supabase.from("feedback").insert({
      user_id: userId,
      name: name.trim(),
      email: email.trim(),
      category: cat,
      message: message.trim(),
    });

    if (error) {
      console.error("Feedback insert error:", error);
      return NextResponse.json({ error: "Failed to save feedback." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
