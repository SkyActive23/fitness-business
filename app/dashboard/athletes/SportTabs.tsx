'use client';

export default function SportTabs({
  sports,
  selectedSport,
  onSelectSport,
}: {
  sports: string[];
  selectedSport: string;
  onSelectSport: (sport: string) => void;
}) {
  if (!sports.length) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {sports.map((sport) => {
        const isActive = sport === selectedSport;

        return (
          <button
            key={sport}
            type="button"
            onClick={() => onSelectSport(sport)}
            className={`px-5 py-2 rounded-full border font-semibold shadow transition ${
              isActive
                ? 'bg-white text-slate-800 border-white'
                : 'bg-slate-700 text-white border-slate-500 hover:bg-slate-600'
            }`}
          >
            {sport}
          </button>
        );
      })}
    </div>
  );
}