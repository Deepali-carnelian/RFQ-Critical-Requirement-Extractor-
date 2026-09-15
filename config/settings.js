const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

const INPUT_PDF = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT_DIR, "01 Basis of Design 1.pdf");

module.exports = {
	ROOT_DIR,
	INPUT_PDF,

	OUTPUT_JSON: path.join(ROOT_DIR, "critical_requirements_hybrid_llm.json"),

	DEBUG_CANDIDATES_JSON: path.join(ROOT_DIR, "rfq_candidates_debug.json"),

	// Override in PowerShell:
	// $env:GEMINI_MODEL="your-model-name" added multiple as it might give 503 error 
	GEMINI_MODELS: [
		"gemini-3.5-flash-lite",
		"gemini-3.5-flash",
		"gemini-3.6-flash",
		"gemini-3.7-flash",
		"gemini-3.8-flash",
		"gemini-2.5-flash-lite",
		"gemini-2.5-flash",
	],

	BATCH_SIZE: 8,
	MIN_RULE_SCORE: 2,
	MIN_LLM_CONFIDENCE: 70,
	MAX_CANDIDATES: 80,
};
