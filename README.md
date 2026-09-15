# RFQ Critical Requirement Pipeline

## Structure

- `main.js` — orchestration only
- `config/settings.js` — paths, model and thresholds
- `config/rules.js` — candidate-detection rules
- `config/llmConfig.js` — Gemini prompt, allowed values and JSON schema
- `services/pdfService.js` — PDF page extraction
- `services/candidateService.js` — rule scoring and candidate generation
- `services/geminiService.js` — Gemini API calls
- `services/validationService.js` — deterministic validation and de-duplication
- `services/outputService.js` — JSON output
- `utils/textUtils.js` — shared text/similarity helpers

## Install

```powershell
npm init -y
npm install pdf-parse@1.1.1 @google/genai

```

## API key

```powershell
$env:GEMINI_API_KEY="YOUR_API_KEY"
```

## Run

Put `01 Basis of Design 1.pdf` in the same folder as `main.js`, then run:

```powershell
node main.js
```
If  received this error - Pipeline failed:
 `{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}
use different Gemini model 

```$env:GEMINI_MODEL="gemini-3.7-flash"

```node main.js
Or pass a different PDF:

```powershell
node main.js "C:\path\to\document.pdf"
```

## Outputs

- `rfq_candidates_debug.json`
- `critical_requirements_hybrid_llm.json`
