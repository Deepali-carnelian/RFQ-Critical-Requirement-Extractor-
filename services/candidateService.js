const RULES = require("../config/rules");

const {
  MIN_RULE_SCORE,
  MAX_CANDIDATES,
} = require("../config/settings");

const {
  normalizeWhitespace,
  jaccardSimilarity,
} = require("../utils/textUtils");

function ruleAssessment(text) {
  let score = 0;
  const matchedRules = [];

  for (const rule of RULES) {
    if (rule.regex.test(text)) {
      score += rule.weight;
      matchedRules.push(rule.name);
    }
  }

  if (/\d/.test(text)) {
    score += 1;
  }

  return {
    score,
    matchedRules,
  };
}

function sentenceRanges(text) {
  const ranges = [];
  const regex = /[^.!?]+(?:[.!?]+|$)/g;

  let match;

  while ((match = regex.exec(text)) !== null) {
    const sentence = normalizeWhitespace(match[0]);

    if (sentence.length < 8) {
      continue;
    }

    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
      text: sentence,
    });
  }

  return ranges;
}

function expandRange(text, start, end, radius = 320) {
  let expandedStart = Math.max(0, start - radius);
  let expandedEnd = Math.min(text.length, end + radius);

  const leftBoundary = Math.max(
    text.lastIndexOf(".", start),
    text.lastIndexOf(";", start),
    text.lastIndexOf(":", start)
  );

  if (leftBoundary >= expandedStart) {
    expandedStart = leftBoundary + 1;
  }

  const dot = text.indexOf(".", end);
  const semi = text.indexOf(";", end);

  const rightCandidates = [dot, semi]
    .filter((x) => x >= 0 && x <= expandedEnd)
    .sort((a, b) => a - b);

  if (rightCandidates.length) {
    expandedEnd = rightCandidates[0] + 1;
  }

  return {
    start: expandedStart,
    end: expandedEnd,
    text: normalizeWhitespace(
      text.slice(expandedStart, expandedEnd)
    ),
  };
}

function rangesOverlap(a, b) {
  return (
    a.start <= b.end &&
    b.start <= a.end
  );
}

function mergeCandidateRanges(text, ranges) {
  if (!ranges.length) {
    return [];
  }

  const sorted = [...ranges].sort(
    (a, b) => a.start - b.start
  );

  const merged = [];

  for (const range of sorted) {
    if (!merged.length) {
      merged.push({ ...range });
      continue;
    }

    const last = merged[merged.length - 1];

    if (
      rangesOverlap(last, range) ||
      range.start - last.end < 80
    ) {
      last.end = Math.max(last.end, range.end);
      last.start = Math.min(last.start, range.start);
      last.text = normalizeWhitespace(
        text.slice(last.start, last.end)
      );
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}

function extractCandidatesFromPage(page) {
  const text = page.text;
  const rawRanges = [];

  // A. Sentence-level matching.
  for (const sentence of sentenceRanges(text)) {
    const assessment = ruleAssessment(sentence.text);

    if (assessment.score >= MIN_RULE_SCORE) {
      rawRanges.push(
        expandRange(
          text,
          sentence.start,
          sentence.end,
          220
        )
      );
    }
  }

  // B. Direct rule scanning for tables / flattened text.
  for (const rule of RULES) {
    const flags = rule.regex.flags.includes("g")
      ? rule.regex.flags
      : rule.regex.flags + "g";

    const globalRegex = new RegExp(
      rule.regex.source,
      flags
    );

    let match;

    while ((match = globalRegex.exec(text)) !== null) {
      rawRanges.push(
        expandRange(
          text,
          match.index,
          match.index + match[0].length,
          300
        )
      );

      if (match[0].length === 0) {
        globalRegex.lastIndex++;
      }
    }
  }

  const mergedRanges = mergeCandidateRanges(
    text,
    rawRanges
  );

  return mergedRanges
    .map((range) => {
      const assessment = ruleAssessment(range.text);

      return {
        page: page.page,
        text: range.text,
        rule_score: assessment.score,
        matched_rules: assessment.matchedRules,
      };
    })
    .filter(
      (candidate) =>
        candidate.rule_score >= MIN_RULE_SCORE &&
        candidate.text.length >= 30
    );
}

function buildCandidates(pages) {
  let candidates = [];

  for (const page of pages) {
    candidates.push(
      ...extractCandidatesFromPage(page)
    );
  }

  const deduped = [];

  for (const candidate of candidates) {
    const duplicate = deduped.find(
      (existing) =>
        existing.page === candidate.page &&
        jaccardSimilarity(
          existing.text,
          candidate.text
        ) >= 0.82
    );

    if (!duplicate) {
      deduped.push(candidate);
    } else if (
      candidate.rule_score >
      duplicate.rule_score
    ) {
      Object.assign(
        duplicate,
        candidate
      );
    }
  }

  // Stronger candidates first before API call.
  deduped.sort(
    (a, b) =>
      b.rule_score - a.rule_score ||
      a.page - b.page
  );

  if (deduped.length > MAX_CANDIDATES) {
    deduped.length = MAX_CANDIDATES;
  }

  deduped.forEach((candidate, index) => {
    candidate.candidate_id =
      `CAND-${String(index + 1).padStart(3, "0")}`;
  });

  return deduped;
}

module.exports = {
  ruleAssessment,
  buildCandidates,
};
