const fs = require("fs");

const {
  INPUT_PDF,
  OUTPUT_JSON,
  DEBUG_CANDIDATES_JSON,
  MODEL,
} = require("./config/settings");

const { extractPages } = require("./services/pdfService");
const { buildCandidates } = require("./services/candidateService");
const { classifyCandidatesWithLLM } = require("./services/geminiService");
const {
  validateAndGroundResults,
  deduplicateFinalRequirements,
} = require("./services/validationService");
const {
  writeCandidateDebugJson,
  writeFinalJson,
} = require("./services/outputService");

async function main() {
  if (!fs.existsSync(INPUT_PDF)) {
    throw new Error(
      `PDF not found: ${INPUT_PDF}\n` +
      "Put the PDF in the project root or pass its path as an argument."
    );
  }

  console.log("--------------------------------------------------");
  console.log("Hybrid RFQ Critical Requirement Pipeline");
  console.log("--------------------------------------------------");
  console.log(`PDF: ${INPUT_PDF}`);
  console.log(`Gemini model: ${MODEL}`);

  // 1. PDF -> page text
  const pages = await extractPages(INPUT_PDF);
  console.log(`1. Extracted ${pages.length} PDF pages.`);

  // 2. Rules -> candidate requirements
  const candidates = buildCandidates(pages);
  console.log(`2. Rule layer produced ${candidates.length} candidates.`);

  writeCandidateDebugJson(candidates);
  console.log(`   Debug candidates: ${DEBUG_CANDIDATES_JSON}`);

  if (!candidates.length) {
    throw new Error("No rule-based candidates were found.");
  }

  // 3. Candidates -> Gemini semantic reasoning
  const llmResults = await classifyCandidatesWithLLM(candidates);
  console.log(`3. Gemini returned ${llmResults.length} candidate judgements.`);

  // 4. Deterministic validation / source grounding
  const validated = validateAndGroundResults(candidates, llmResults);
  console.log(
    `4. ${validated.length} High/Critical results passed deterministic validation.`
  );

  // 5. De-duplicate + sort by source page
  const finalRows = deduplicateFinalRequirements(validated);
  console.log(
    `5. ${finalRows.length} final requirements remain after deduplication.`
  );

  // 6. Final JSON
  writeFinalJson(finalRows);

  console.log("--------------------------------------------------");
  console.log(`DONE: ${OUTPUT_JSON}`);
  console.log("Final JSON is sorted by increasing source page.");
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error("\nPipeline failed:");
  console.error(error.message || error);
  process.exit(1);
});
