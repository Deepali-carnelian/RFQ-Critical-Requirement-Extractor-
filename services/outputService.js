const fs = require("fs");
const path = require("path");

const {
  INPUT_PDF,
  OUTPUT_JSON,
  DEBUG_CANDIDATES_JSON,
  MODEL,
} = require("../config/settings");

function writeJsonFile(
  data,
  outputPath
) {
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      data,
      null,
      2
    ),
    "utf8"
  );
}

function writeCandidateDebugJson(
  candidates
) {
  const rows =
    candidates
      .slice()
      .sort(
        (a, b) =>
          a.page - b.page ||
          b.rule_score - a.rule_score
      )
      .map(
        (candidate) => ({
          candidate_id:
            candidate.candidate_id,

          source_page:
            `p.${candidate.page}`,

          rule_score:
            candidate.rule_score,

          matched_rules:
            candidate.matched_rules,

          candidate_text:
            candidate.text,
        })
      );

  const output = {
    source_document:
      path.basename(INPUT_PDF),

    candidate_count:
      rows.length,

    candidates:
      rows,
  };

  writeJsonFile(
    output,
    DEBUG_CANDIDATES_JSON
  );
}

function writeFinalJson(rows) {
  const output = {
    source_document:
      path.basename(INPUT_PDF),

    pipeline:
      "Rules -> candidate extraction -> Gemini reasoning -> deterministic validation -> JSON",

    llm_model:
      MODEL,

    generated_at:
      new Date().toISOString(),

    requirement_count:
      rows.length,

    requirements:
      rows,
  };

  writeJsonFile(
    output,
    OUTPUT_JSON
  );
}

module.exports = {
  writeCandidateDebugJson,
  writeFinalJson,
};
