const { GoogleGenAI } = require("@google/genai");

const { GEMINI_MODELS, BATCH_SIZE } = require("../config/settings");

const { SYSTEM_PROMPT, OUTPUT_SCHEMA } = require("../config/llmConfig");

const { sleep } = require("../utils/textUtils");

// ======================================================
// GEMINI CLIENT
// ======================================================

function createGeminiClient() {
	if (!process.env.GEMINI_API_KEY) {
		throw new Error(
			"GEMINI_API_KEY is not set.\n\n" +
				"PowerShell:\n" +
				'$env:GEMINI_API_KEY="YOUR_API_KEY"',
		);
	}

	return new GoogleGenAI({
		apiKey: process.env.GEMINI_API_KEY,
	});
}

// ======================================================
// CALL ONE MODEL
// ======================================================

async function callGeminiModel(client, model, payload) {
	const response = await client.models.generateContent({
		model,

		contents: JSON.stringify(payload),

		config: {
			systemInstruction: SYSTEM_PROMPT,

			responseMimeType: "application/json",

			responseSchema: OUTPUT_SCHEMA,
		},
	});

	const outputText = response.text;

	if (!outputText) {
		throw new Error(`${model} returned no response text.`);
	}

	return JSON.parse(outputText);
}

// ======================================================
// TRY MODELS WITH FALLBACK
// ======================================================

async function reasonOverBatch(client, candidates) {
	const payload = {
		candidates: candidates.map((candidate) => ({
			candidate_id: candidate.candidate_id,

			source_page: candidate.page,

			rule_score: candidate.rule_score,

			matched_rules: candidate.matched_rules,

			source_text: candidate.text,
		})),
	};

	let lastError = null;

	for (const model of GEMINI_MODELS) {
		console.log(`   Trying model: ${model}`);

		// Retry each model 3 times.
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				const result = await callGeminiModel(client, model, payload);

				console.log(`   ✓ Success with ${model}`);

				return {
					parsed: result,

					modelUsed: model,
				};
			} catch (error) {
				lastError = error;

				const message = String(error?.message || error);

				const is503 =
					message.includes("503") ||
					message.includes("UNAVAILABLE") ||
					message.toLowerCase().includes("high demand");

				const is429 =
					message.includes("429") ||
					message.toLowerCase().includes("resource_exhausted");

				console.warn(`   ${model} failed ` + `(attempt ${attempt}/3)`);

				// Long backoff for capacity problems.
				if (is503 || is429) {
					const waits = [10000, 20000, 40000];

					const waitMs = waits[attempt - 1];

					console.log(`   Waiting ${waitMs / 1000}s...`);

					await sleep(waitMs);
				} else {
					// Non-capacity error:
					// don't waste three attempts.
					console.warn(message);

					break;
				}
			}
		}

		console.log(`   Moving to fallback model...`);
	}

	throw new Error(
		"All Gemini models failed.\n\n" + String(lastError?.message || lastError),
	);
}

// ======================================================
// PROCESS ALL BATCHES
// ======================================================

async function classifyCandidatesWithLLM(candidates) {
	const client = createGeminiClient();

	const results = [];

	const totalBatches = Math.ceil(candidates.length / BATCH_SIZE);

	for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
		const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

		const batch = candidates.slice(i, i + BATCH_SIZE);

		console.log("\n--------------------------------");

		console.log(`Gemini batch ` + `${batchNumber}/${totalBatches}`);

		console.log(`${batch.length} candidates`);

		const { parsed, modelUsed } = await reasonOverBatch(client, batch);

		if (!parsed || !Array.isArray(parsed.results)) {
			throw new Error(`Invalid Gemini output for batch ${batchNumber}.`);
		}

		// Save which model actually generated
		// each classification.
		const batchResults = parsed.results.map((result) => ({
			...result,

			model_used: modelUsed,
		}));

		results.push(...batchResults);

		console.log(`Batch ${batchNumber} completed using ${modelUsed}`);

		// Avoid rapid API calls.
		if (i + BATCH_SIZE < candidates.length) {
			await sleep(3000);
		}
	}

	return results;
}

module.exports = {
	classifyCandidatesWithLLM,
};
