import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STAGE_CONTEXT: Record<string, string> = {
  pre_due_7: "a friendly 7-day pre-due reminder",
  pre_due_3: "an urgent 3-day pre-due reminder",
  due_today: "a due-date payment request",
  overdue_3: "a 3-day overdue follow-up",
  overdue_10: "a 10-day overdue escalation",
};

export interface RewriteInput {
  subject: string;
  body: string;
  tone: "friendly" | "neutral" | "firm";
  stage: string;
}

export interface RewriteOutput {
  subject: string;
  body: string;
}

export async function rewriteTemplate(input: RewriteInput): Promise<RewriteOutput> {
  const stageContext = STAGE_CONTEXT[input.stage] ?? "an invoice reminder";

  const prompt = `You are rewriting an invoice reminder email template for a freelancer.

Context:
- Email type: ${stageContext}
- Desired tone: ${input.tone}
  - friendly: warm, understanding, assumes good faith, light nudge
  - neutral: professional, factual, no emotional charge
  - firm: direct, serious, clear consequences implied

Current subject: ${input.subject}
Current body:
${input.body}

Rules:
1. Preserve ALL template variables exactly as-is: {{client_name}}, {{invoice_number}}, {{amount}}, {{currency}}, {{due_date}}, {{payment_link}}, {{sender_name}}, {{unsubscribe_link}}
2. Keep it concise — freelancers value brevity
3. Match the tone precisely
4. Do not add any variables not in the original
5. Return ONLY valid JSON, no markdown, no explanation

Return JSON in this exact format:
{"subject": "...", "body": "..."}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned invalid response");

  const parsed = JSON.parse(jsonMatch[0]) as RewriteOutput;
  if (!parsed.subject || !parsed.body) throw new Error("AI response missing fields");

  return parsed;
}
