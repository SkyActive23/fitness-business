export type RadarScoreDatum = {
  metric: string;
  score: number;
  label: string;
  raw: number | null;
};

type BuildRadarScoresInput = {
  cmj: number | null;
  mod_505: number | null;
  sprint_20m: number | null;
  squat_max_lbs: number | null;
  bench_max_lbs: number | null;
  clean_max_lbs: number | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreLabel(score: number) {
  if (score < 1.5) return 'Poor';
  if (score < 2.5) return 'Below Average';
  if (score < 3.5) return 'Average';
  if (score < 4.5) return 'Good';
  return 'Elite';
}

/**
 * Higher is better
 * cutoffs should be ascending: [poor/below, below/avg, avg/good, good/elite]
 *
 * Produces a continuous 1.0 to 5.0 score.
 */
function scoreHighContinuous(
  value: number | null,
  cutoffs: [number, number, number, number]
) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;

  const [c1, c2, c3, c4] = cutoffs;

  if (value <= c1) {
    const floor = c1 === 0 ? 0 : c1 * 0.75;
    const t = (value - floor) / (c1 - floor || 1);
    return clamp(1 + Math.max(0, t) * 0.999, 1, 1.999);
  }

  if (value <= c2) {
    const t = (value - c1) / (c2 - c1 || 1);
    return 2 + t * 0.999;
  }

  if (value <= c3) {
    const t = (value - c2) / (c3 - c2 || 1);
    return 3 + t * 0.999;
  }

  if (value <= c4) {
    const t = (value - c3) / (c4 - c3 || 1);
    return 4 + t * 0.999;
  }

  const extension = (c4 - c3) || 1;
  const t = (value - c4) / extension;
  return clamp(5 + t * 0.25, 5, 5);
}

/**
 * Lower is better
 * cutoffs should be descending in performance meaning:
 * [poor/below, below/avg, avg/good, good/elite]
 * Example: [3.50, 3.30, 3.10, 2.90]
 *
 * Produces a continuous 1.0 to 5.0 score.
 */
function scoreLowContinuous(
  value: number | null,
  cutoffs: [number, number, number, number]
) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;

  const [c1, c2, c3, c4] = cutoffs;

  if (value >= c1) {
    const ceiling = c1 + (c1 - c2 || 0.2);
    const t = (ceiling - value) / (ceiling - c1 || 1);
    return clamp(1 + Math.max(0, t) * 0.999, 1, 1.999);
  }

  if (value >= c2) {
    const t = (c1 - value) / (c1 - c2 || 1);
    return 2 + t * 0.999;
  }

  if (value >= c3) {
    const t = (c2 - value) / (c2 - c3 || 1);
    return 3 + t * 0.999;
  }

  if (value >= c4) {
    const t = (c3 - value) / (c3 - c4 || 1);
    return 4 + t * 0.999;
  }

  const extension = (c3 - c4) || 1;
  const t = (c4 - value) / extension;
  return clamp(5 + t * 0.25, 5, 5);
}

export function buildRadarScores(input: BuildRadarScoresInput): RadarScoreDatum[] {
  const normCuts = {
    CMJ: [16, 20, 28, 34] as [number, number, number, number],
    Mod505: [3.5, 3.3, 3.1, 2.9] as [number, number, number, number],
    Sprint20: [3.07, 2.99, 2.9, 2.82] as [number, number, number, number],
    Squat: [260, 295, 325, 360] as [number, number, number, number],
    Bench: [160, 190, 220, 250] as [number, number, number, number],
    Clean: [140, 185, 245, 310] as [number, number, number, number],
  };

  const data = [
    {
      metric: 'CMJ',
      raw: input.cmj,
      score: scoreHighContinuous(input.cmj, normCuts.CMJ),
    },
    {
      metric: '505',
      raw: input.mod_505,
      score: scoreLowContinuous(input.mod_505, normCuts.Mod505),
    },
    {
      metric: '20m',
      raw: input.sprint_20m,
      score: scoreLowContinuous(input.sprint_20m, normCuts.Sprint20),
    },
    {
      metric: 'Squat',
      raw: input.squat_max_lbs,
      score: scoreHighContinuous(input.squat_max_lbs, normCuts.Squat),
    },
    {
      metric: 'Bench',
      raw: input.bench_max_lbs,
      score: scoreHighContinuous(input.bench_max_lbs, normCuts.Bench),
    },
    {
      metric: 'Clean',
      raw: input.clean_max_lbs,
      score: scoreHighContinuous(input.clean_max_lbs, normCuts.Clean),
    },
  ];

  return data.map((item) => ({
    metric: item.metric,
    raw: item.raw,
    score: item.score === null ? 0 : Number(item.score.toFixed(2)),
    label: item.score === null ? '—' : scoreLabel(item.score),
  }));
}