export type RadarScoreDatum = {
  metric: string;
  score: number;
  label: string;
  raw: number | null;
};

type BuildBaseballRadarScoresInput = {
  best_vertical_in: number | null;
  grip_avg: number | null;
  yd_60: number | null;
  squat: number | null;
  bench: number | null;
  trap_bar_dl: number | null;
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

  return 5;
}

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

  return 5;
}

export function buildBaseballRadarScores(
  input: BuildBaseballRadarScoresInput
): RadarScoreDatum[] {
  const normCuts = {
    CMJ: [22, 26, 30, 34] as [number, number, number, number],
    Grip: [50, 60, 67, 75] as [number, number, number, number],
    Speed: [7.5, 7.25, 7.0, 6.7] as [number, number, number, number],
    Squat: [220, 265, 320, 365] as [number, number, number, number],
    Bench: [175, 210, 240, 275] as [number, number, number, number],
    DL: [275, 365, 470, 586] as [number, number, number, number],
  };

  const data = [
    {
      metric: 'CMJ',
      raw: input.best_vertical_in,
      score: scoreHighContinuous(input.best_vertical_in, normCuts.CMJ),
    },
    {
      metric: 'Grip',
      raw: input.grip_avg,
      score: scoreHighContinuous(input.grip_avg, normCuts.Grip),
    },
    {
      metric: '60 yd',
      raw: input.yd_60,
      score: scoreLowContinuous(input.yd_60, normCuts.Speed),
    },
    {
      metric: 'Squat',
      raw: input.squat,
      score: scoreHighContinuous(input.squat, normCuts.Squat),
    },
    {
      metric: 'Bench',
      raw: input.bench,
      score: scoreHighContinuous(input.bench, normCuts.Bench),
    },
    {
      metric: 'Trap Bar DL',
      raw: input.trap_bar_dl,
      score: scoreHighContinuous(input.trap_bar_dl, normCuts.DL),
    },
  ];

  return data.map((item) => ({
    metric: item.metric,
    raw: item.raw,
    score: item.score === null ? 0 : Number(item.score.toFixed(2)),
    label: item.score === null ? '—' : scoreLabel(item.score),
  }));
}