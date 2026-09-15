function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForDedupe(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text) {
  return new Set(
    normalizeForDedupe(text)
      .split(" ")
      .filter((token) => token.length > 2)
  );
}

function jaccardSimilarity(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);

  if (!A.size || !B.size) return 0;

  let intersection = 0;

  for (const token of A) {
    if (B.has(token)) {
      intersection++;
    }
  }

  const union = A.size + B.size - intersection;
  return union ? intersection / union : 0;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  normalizeWhitespace,
  normalizeForDedupe,
  tokenSet,
  jaccardSimilarity,
  sleep,
};
