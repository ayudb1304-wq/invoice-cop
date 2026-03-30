import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { rewriteTemplate } from "@/lib/ai/rewrite";

// Simple in-memory rate limiting: 5 rewrites per user per day
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 86_400_000 });
    return true;
  }

  if (entry.count >= 5) return false;

  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Rate limit reached. You can rewrite up to 5 templates per day." },
      { status: 429 }
    );
  }

  const body = await req.json() as {
    subject?: string;
    body?: string;
    tone?: string;
    stage?: string;
  };

  if (!body.subject || !body.body || !body.tone || !body.stage) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["friendly", "neutral", "firm"].includes(body.tone)) {
    return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
  }

  try {
    const result = await rewriteTemplate({
      subject: body.subject,
      body: body.body,
      tone: body.tone as "friendly" | "neutral" | "firm",
      stage: body.stage,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("AI rewrite error:", err);
    return NextResponse.json({ error: "AI rewrite failed. Please try again." }, { status: 500 });
  }
}
