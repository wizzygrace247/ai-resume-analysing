import Groq from "groq-sdk";
import type { Route } from "./+types/api.analyze";

// This file only exports an `action` (no default component export), which
// makes it a React Router "resource route" — it behaves like a plain API
// endpoint at /api/analyze. Because loaders/actions run server-side and are
// stripped from the client bundle, GROQ_API_KEY never ships to the browser.

const MODEL = "openai/gpt-oss-120b";

// Mirrors the `Feedback` interface in types/index.d.ts. Kept in strict
// JSON Schema form so Groq's structured outputs can guarantee the shape.
const tipWithExplanation = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["good", "improve"] },
    tip: { type: "string" },
    explanation: { type: "string" },
  },
  required: ["type", "tip", "explanation"],
  additionalProperties: false,
};

const scoredCategory = {
  type: "object",
  properties: {
    score: { type: "number" },
    tips: { type: "array", items: tipWithExplanation },
  },
  required: ["score", "tips"],
  additionalProperties: false,
};

const feedbackSchema = {
  type: "object",
  properties: {
    overallScore: { type: "number" },
    ATS: {
      type: "object",
      properties: {
        score: { type: "number" },
        tips: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["good", "improve"] },
              tip: { type: "string" },
            },
            required: ["type", "tip"],
            additionalProperties: false,
          },
        },
      },
      required: ["score", "tips"],
      additionalProperties: false,
    },
    toneAndStyle: scoredCategory,
    content: scoredCategory,
    structure: scoredCategory,
    skills: scoredCategory,
  },
  required: ["overallScore", "ATS", "toneAndStyle", "content", "structure", "skills"],
  additionalProperties: false,
};

function buildPrompt({
  resumeText,
  jobTitle,
  jobDescription,
}: {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
}) {
  return `You are an expert in ATS (Applicant Tracking System) and resume analysis.
Analyze and rate the resume below and suggest how to improve it.
The rating can be low if the resume is bad. Be thorough and detailed.
Don't be afraid to point out mistakes or areas for improvement — if there's a
lot to improve, give low scores. This is to help the user improve their resume.
If a job title or job description is provided, take it into account when
scoring and writing tips.

Job title: ${jobTitle || "Not provided"}
Job description: ${jobDescription || "Not provided"}

Resume text:
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
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const resumeText = body.resumeText?.trim();
  if (!resumeText || resumeText.length < 50) {
    return Response.json(
      { error: "resumeText is missing or too short to analyze" },
      { status: 400 }
    );
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: buildPrompt({
            resumeText,
            jobTitle: body.jobTitle ?? "",
            jobDescription: body.jobDescription ?? "",
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "resume_feedback",
          strict: true,
          schema: feedbackSchema,
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

    const feedback = JSON.parse(raw);
    return Response.json(feedback satisfies Feedback);
  } catch (err) {
    console.error("Groq analyze error:", err);
    return Response.json(
      { error: "Failed to analyze resume" },
      { status: 502 }
    );
  }
}