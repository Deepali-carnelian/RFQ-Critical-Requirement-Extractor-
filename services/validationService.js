const {
  MIN_LLM_CONFIDENCE,
} = require("../config/settings");

const {
  ALLOWED_CRITICALITIES,
  ALLOWED_CATEGORIES,
} = require("../config/llmConfig");

const {
  normalizeWhitespace,
  jaccardSimilarity,
} = require("../utils/textUtils");

function validateAndGroundResults(
  candidates,
  llmResults
) {
  const candidateMap =
    new Map(
      candidates.map(
        (candidate) => [
          candidate.candidate_id,
          candidate,
        ]
      )
    );

  const grounded = [];

  for (const result of llmResults) {
    const candidate =
      candidateMap.get(
        result.candidate_id
      );

    // Gemini may only classify an existing candidate.
    if (!candidate) {
      console.warn(
        `Rejected unknown candidate ID: ${result.candidate_id}`
      );
      continue;
    }

    if (!result.keep) {
      continue;
    }

    if (
      !ALLOWED_CRITICALITIES.has(
        result.criticality
      )
    ) {
      continue;
    }

    if (
      !ALLOWED_CATEGORIES.has(
        result.category
      )
    ) {
      continue;
    }

    // Final deliverable keeps only Critical + High.
    if (
      !["Critical", "High"].includes(
        result.criticality
      )
    ) {
      continue;
    }

    if (
      !Number.isInteger(
        result.confidence
      ) ||
      result.confidence <
        MIN_LLM_CONFIDENCE ||
      result.confidence > 100
    ) {
      continue;
    }

    const requirement =
      normalizeWhitespace(
        result.requirement
      );

    const whyCritical =
      normalizeWhitespace(
        result.why_critical
      );

    const bidTeamAction =
      normalizeWhitespace(
        result.bid_team_action
      );

    const openPoint =
      normalizeWhitespace(
        result.ambiguity_or_open_point
      );

    if (
      requirement.length < 15 ||
      requirement.length > 500
    ) {
      continue;
    }

    if (
      whyCritical.length < 15 ||
      whyCritical.length > 700
    ) {
      continue;
    }

    if (
      bidTeamAction.length < 5 ||
      bidTeamAction.length > 500
    ) {
      continue;
    }

    // Page/evidence come from the deterministic PDF candidate,
    // never from the LLM.
    grounded.push({
			id: "",

			source_page: `p.${candidate.page}`,

			requirement,

			criticality: result.criticality,

			category: result.category,

			why_critical: whyCritical,

			bid_team_action: bidTeamAction,

			ambiguity_or_open_point: openPoint,

			confidence: result.confidence,

			rule_score: candidate.rule_score,

			matched_rules: candidate.matched_rules,

			evidence_excerpt:
				candidate.text.length > 650
					? candidate.text.slice(0, 650) + "..."
					: candidate.text,

			candidate_id: candidate.candidate_id,

			llm_model: result.model_used || "Gemini",
		});
  }

  return grounded;
}

function deduplicateFinalRequirements(rows) {
  const criticalityRank = {
    Critical: 2,
    High: 1,
  };

  const sorted =
    [...rows].sort(
      (a, b) => {
        const rankDiff =
          (
            criticalityRank[
              b.criticality
            ] || 0
          ) -
          (
            criticalityRank[
              a.criticality
            ] || 0
          );

        if (rankDiff) {
          return rankDiff;
        }

        const confidenceDiff =
          b.confidence -
          a.confidence;

        if (confidenceDiff) {
          return confidenceDiff;
        }

        return (
          b.rule_score -
          a.rule_score
        );
      }
    );

  const kept = [];

  for (const row of sorted) {
    const duplicateIndex =
      kept.findIndex(
        (existing) => {
          const requirementSimilarity =
            jaccardSimilarity(
              existing.requirement,
              row.requirement
            );

          const evidenceSimilarity =
            existing.source_page ===
            row.source_page
              ? jaccardSimilarity(
                  existing.evidence_excerpt,
                  row.evidence_excerpt
                )
              : 0;

          return (
            requirementSimilarity >= 0.72 ||
            evidenceSimilarity >= 0.86
          );
        }
      );

    if (duplicateIndex === -1) {
      kept.push(row);
    }
  }

  // Final output sorted by source page.
  kept.sort(
    (a, b) => {
      const pageA =
        Number(
          a.source_page.replace(
            "p.",
            ""
          )
        ) ||
        Number.MAX_SAFE_INTEGER;

      const pageB =
        Number(
          b.source_page.replace(
            "p.",
            ""
          )
        ) ||
        Number.MAX_SAFE_INTEGER;

      if (pageA !== pageB) {
        return pageA - pageB;
      }

      if (
        a.criticality !==
        b.criticality
      ) {
        return (
          a.criticality ===
          "Critical"
            ? -1
            : 1
        );
      }

      return (
        b.confidence -
        a.confidence
      );
    }
  );

  // IDs assigned after final ordering.
  kept.forEach(
    (row, index) => {
      row.id =
        `CR-${String(
          index + 1
        ).padStart(
          2,
          "0"
        )}`;
    }
  );

  return kept;
}

module.exports = {
  validateAndGroundResults,
  deduplicateFinalRequirements,
};
