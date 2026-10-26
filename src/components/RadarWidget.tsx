import React from 'react';
import { SignalArrayState, StoryLocation } from '../types/game';
import { STORY_LOCATIONS } from '../data/storyLandmarks';

interface RadarWidgetProps {
  signalArray: SignalArrayState;
  playerPos: { x: number; y: number; z: number };
  playerYaw: number;
  onTuneFrequency: (freq: number) => void;
  onOpenJournal: () => void;
}

export const RadarWidget: React.FC<RadarWidgetProps> = ({
  signalArray,
  playerPos,
  playerYaw,
  onTuneFrequency,
  onOpenJournal,
}) => {
  const isOnline = signalArray.powerCellInserted && signalArray.nodesPlacedCount >= 3;
  const activeLoc = STORY_LOCATIONS[signalArray.activeLocationId];

  // Calculate distance & relative angle to active story location
  const dx = activeLoc.x - playerPos.x;
  const dz = activeLoc.z - playerPos.z;
  const dist = Math.round(Math.sqrt(dx * dx + dz * dz));

  // World angle: Math.atan2(dx, -dz)
  const worldAngle = Math.atan2(dx, -dz);
  // Relative angle to player's look heading
  const relativeAngle = worldAngle - playerYaw;

  const needleDeg = (relativeAngle * 180) / Math.PI;

  const frequencies = Object.values(STORY_LOCATIONS).map((l) => ({
    id: l.id,
    name: l.name,
    freq: l.frequency,
    icon: l.icon,
  }));

  return (
    <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-emerald-400 font-mono flex flex-col gap-2.5 w-64 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base animate-pulse">📡</span>
          <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">SIGNAL ARRAY</span>
        </div>
        <button
          onClick={onOpenJournal}
          className="text-[10px] bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 px-2 py-0.5 rounded text-emerald-200 transition-colors"
        >
          📖 Journal
        </button>
      </div>

      {/* Grid Status Requirements */}
      {!isOnline ? (
        <div className="bg-slate-900/80 rounded-xl p-2.5 text-[11px] border border-amber-500/30 text-amber-300 flex flex-col gap-1">
          <div className="font-bold text-xs flex items-center gap-1 text-amber-200">
            <span>⚠️ Grid Offline</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            <span>Locator Nodes:</span>
            <span className={signalArray.nodesPlacedCount >= 3 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {signalArray.nodesPlacedCount}/3 Placed
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            <span>Power Cell:</span>
            <span className={signalArray.powerCellInserted ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
              {signalArray.powerCellInserted ? '✓ Slotted' : '✗ Required'}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">
            Craft 3 Locator Antennas & slot a Power Cell into the Signal Receiver to activate radar tracking.
          </p>
        </div>
      ) : (
        <>
          {/* Active CRT Radar Scope */}
          <div className="relative w-full aspect-square bg-emerald-950/40 rounded-full border-2 border-emerald-500/60 overflow-hidden flex items-center justify-center shadow-[inset_0_0_20px_rgba(16,185,129,0.3)]">
            {/* Concentric distance rings */}
            <div className="absolute inset-4 rounded-full border border-emerald-500/20" />
            <div className="absolute inset-10 rounded-full border border-emerald-500/20" />
            <div className="absolute inset-16 rounded-full border border-emerald-500/20" />

            {/* Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500/30" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-500/30" />

            {/* Sweeping Radar Line */}
            <div
              className="absolute w-1/2 h-0.5 origin-left bg-gradient-to-r from-emerald-400 to-transparent animate-[spin_4s_linear_infinite]"
              style={{ left: '50%', top: '50%' }}
            />

            {/* Center Ship Dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white z-10 shadow-[0_0_8px_#38bdf8]" />

            {/* Directional Waypoint Needle / Blip */}
            <div
              className="absolute inset-0 flex items-start justify-center transition-transform duration-200"
              style={{ transform: `rotate(${needleDeg}deg)` }}
            >
              <div className="w-4 h-4 -mt-1 text-center text-xs animate-bounce text-rose-400 drop-shadow-[0_0_6px_#f43f5e]">
                ▼
              </div>
            </div>

            {/* Distance Overlay */}
            <div className="absolute bottom-2 font-mono text-[11px] font-bold text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              {dist}m
            </div>
          </div>

          {/* Active Frequency & Landmark Info */}
          <div className="bg-slate-900/90 rounded-xl p-2 border border-emerald-500/30 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-200 truncate flex items-center gap-1">
                <span>{activeLoc.icon}</span> {activeLoc.name}
              </span>
              <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-400 font-bold">
                {activeLoc.frequency.toFixed(1)} MHz
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight line-clamp-1">{activeLoc.tagline}</p>
          </div>

          {/* Quick Frequency Tuner Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
            {frequencies.map((f) => (
              <button
                key={f.id}
                onClick={() => onTuneFrequency(f.freq)}
                className={`text-[9px] px-2 py-1 rounded border font-mono transition-all shrink-0 ${
                  f.id === signalArray.activeLocationId
                    ? 'bg-emerald-600 text-white border-emerald-300 font-bold shadow'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {f.icon} {f.freq.toFixed(1)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
