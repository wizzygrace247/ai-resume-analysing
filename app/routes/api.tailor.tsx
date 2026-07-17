import Groq from "groq-sdk";
import type { Route } from "./+types/api.tailor";

const MODEL = "openai/gpt-oss-120b";

// Mirrors the `TailoredResume` interface in types/index.d.ts.
const tailoredResumeSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string" },
          company: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["role", "company", "bullets"],
        additionalProperties: false,
      },
    },
    skills: { type: "array", items: { type: "string" } },
    changesExplained: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "experience", "skills", "changesExplained"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are an expert resume writer helping a candidate tailor their existing
resume to a specific job. You will be given the candidate's original resume
text, a target job title and description, and a list of flaws already found
in the resume.

Rewrite and restructure the resume to better match the job description:
- Reorder and rephrase existing experience and skills to foreground what's
  most relevant to the job description.
- Fold in the improvements suggested by the flaws list (tone, structure,
  clarity, keyword coverage for ATS).
- Quantify achievements only when a number is already present or directly
  inferable from the original text.

Hard rule: never invent employers, job titles, dates, degrees, certifications,
or metrics that are not present in or directly inferable from the original
resume text. If the original resume doesn't support a claim, do not add it.
When in doubt, rephrase rather than fabricate.

Also return a short "changesExplained" list: 3-6 bullet points describing
what you changed and why it helps for this specific job.`;

function buildUserPrompt({
  resumeText,
  jobTitle,
  jobDescription,
  feedback,
}: {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
  feedback?: Feedback;
}) {
  const flaws = feedback
    ? [
        ...feedback.toneAndStyle.tips,
        ...feedback.content.tips,
        ...feedback.structure.tips,
        ...feedback.skills.tips,
      ]
        .filter((tip) => tip.type === "improve")
        .map((tip) => `- ${tip.tip}: ${tip.explanation}`)
        .join("\n")
    : "None provided.";

  return `Job title: ${jobTitle || "Not provided"}
Job description: ${jobDescription || "Not provided"}

Flaws already identified in this resume:
${flaws || "None provided."}

Original resume text:
"""
${resumeText}
"""`;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: "Server is missing GROQ_API_KEY" },
      { status: 500 }
    );
  }

  let body: {
    resumeText?: string;
    jobTitle?: string;
    jobDescription?: string;
    feedback?: Feedback;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const resumeText = body.resumeText?.trim();
  if (!resumeText || resumeText.length < 50) {
    return Response.json(
      { error: "resumeText is missing or too short to tailor" },
      { status: 400 }
    );
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt({
            resumeText,
            jobTitle: body.jobTitle ?? "",
            jobDescription: body.jobDescription ?? "",
            feedback: body.feedback,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tailored_resume",
          strict: true,
          schema: tailoredResumeSchema,
        },
      },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return Response.json(
        { error: "Groq returned an empty response" },
        { status: 502 }
      );
    }

    const tailored = JSON.parse(raw);
    return Response.json(tailored satisfies TailoredResume);
  } catch (err) {
    console.error("Groq tailor error:", err);
    return Response.json(
      { error: "Failed to tailor resume" },
      { status: 502 }
    );
  }
}