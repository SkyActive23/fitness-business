'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type RadarDatum = {
  metric: string;
  score: number;
  label: string;
  raw: number | null;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0]?.payload;

  if (!item) return null;

  return (
    <div className="rounded-lg border border-slate-500 bg-slate-900 px-4 py-3 text-white shadow-lg">
      <p className="font-bold">{item.metric}</p>
      <p>Raw: {item.raw ?? '—'}</p>
      <p>Score: {item.score}</p>
      <p>Level: {item.label}</p>
    </div>
  );
}

export default function BaseballRadarChart({
  data,
}: {
  data: RadarDatum[];
}) {
  const chartData = data.map((item) => ({
    ...item,
    score: Math.max(0, Math.min(5, item.score)),
  }));

  return (
    <div className="w-full h-[420px] rounded-lg bg-slate-700 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius="72%" data={chartData}>
          <PolarGrid />

          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#ffffff', fontSize: 14 }}
          />

          <PolarRadiusAxis
            domain={[0, 5]}
            tickCount={6}
            angle={90}
            tick={{ fill: '#e2e8f0', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Radar
            name="Performance"
            dataKey="score"
            stroke="#ffffff"
            fill="#ffffff"
            fillOpacity={0.28}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}