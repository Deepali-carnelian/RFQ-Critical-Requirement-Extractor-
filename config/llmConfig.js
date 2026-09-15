const ALLOWED_CRITICALITIES = new Set([
  "Critical",
  "High",
  "Medium",
  "Low",
]);

const ALLOWED_CATEGORIES = new Set([
  "Safety / Regulatory",
  "Technical Feasibility",
  "Flow Assurance / Integrity",
  "Commercial / Schedule",
  "Interface / Brownfield",
  "Environmental",
  "Other",
]);

const SYSTEM_PROMPT = `
You are a senior bid-review engineer assessing an industrial subsea oil & gas RFQ.

Your job is NOT to list every requirement. Identify only requirements that materially affect:
- bid cost
- schedule
- technical feasibility
- safety/regulatory compliance
- equipment/material selection
- operational reliability
- contractual exposure
- accidental releases
- brownfield/interface execution

Criticality definition:

Critical:
Overlooking it could make the bid technically non-compliant, unsafe, infeasible,
materially underpriced, or cause major redesign, shutdown, or schedule impact.

High:
Significant cost/risk/engineering impact requiring explicit bid treatment.

Medium:
Relevant, but unlikely to materially affect bid viability on its own.

Low:
Background, descriptive, or low-consequence information.

Rules:
1. Use ONLY the supplied candidate text.
2. Do NOT introduce external facts.
3. Descriptive information is not automatically a requirement.
4. Keep information only when it affects design, cost, risk, feasibility,
   compliance, or a significant unresolved assumption.
5. Missing, TBD, pending, preliminary or assumed information can be critical
   where it prevents firm design or pricing.
6. Preserve numerical engineering limits exactly.
7. You may paraphrase the requirement, but do not change its engineering meaning.
8. why_critical must explain the consequence rather than repeat the requirement.
9. ambiguity_or_open_point should be empty when there is no meaningful uncertainty.
10. If the candidate is not materially important, return keep=false.
`.trim();

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          candidate_id: { type: "string" },
          keep: { type: "boolean" },
          criticality: {
            type: "string",
            enum: ["Critical", "High", "Medium", "Low"],
          },
          category: {
            type: "string",
            enum: [
              "Safety / Regulatory",
              "Technical Feasibility",
              "Flow Assurance / Integrity",
              "Commercial / Schedule",
              "Interface / Brownfield",
              "Environmental",
              "Other",
            ],
          },
          requirement: { type: "string" },
          why_critical: { type: "string" },
          bid_team_action: { type: "string" },
          ambiguity_or_open_point: { type: "string" },
          confidence: { type: "integer" },
        },
        required: [
          "candidate_id",
          "keep",
          "criticality",
          "category",
          "requirement",
          "why_critical",
          "bid_team_action",
          "ambiguity_or_open_point",
          "confidence",
        ],
      },
    },
  },
  required: ["results"],
};

module.exports = {
  ALLOWED_CRITICALITIES,
  ALLOWED_CATEGORIES,
  SYSTEM_PROMPT,
  OUTPUT_SCHEMA,
};
