import React, { useState } from 'react';
import { StoryLocationId, SignalArrayState } from '../types/game';
import { STORY_LOCATIONS } from '../data/storyLandmarks';

interface StoryJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  signalArray: SignalArrayState;
  onTuneFrequency: (freq: number) => void;
}

export const StoryJournalModal: React.FC<StoryJournalModalProps> = ({
  isOpen,
  onClose,
  signalArray,
  onTuneFrequency,
}) => {
  const [selectedId, setSelectedId] = useState<StoryLocationId>(signalArray.activeLocationId || 'sunken_beacon');

  if (!isOpen) return null;

  const locations = Object.values(STORY_LOCATIONS);
  const selectedLoc = STORY_LOCATIONS[selectedId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 font-sans select-none animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-4 max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧭</span>
            <div>
              <h2 className="text-xl font-black tracking-wide text-emerald-400">SHATTERED HORIZONS JOURNAL</h2>
              <p className="text-xs text-slate-400">Uncover the Tragic History of the Flooded World</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Signal Array Status Banner */}
        <div className="flex flex-wrap items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📡</span>
            <span className="font-bold text-slate-300">Signal Array Status:</span>
            <span
              className={`px-2 py-0.5 rounded font-mono font-bold ${
                signalArray.powerCellInserted && signalArray.nodesPlacedCount >= 3
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-950 text-amber-400 border border-amber-500/40'
              }`}
            >
              {signalArray.powerCellInserted && signalArray.nodesPlacedCount >= 3 ? 'GRID ACTIVE' : 'GRID INCOMPLETE'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>
              Locator Nodes:{' '}
              <strong className={signalArray.nodesPlacedCount >= 3 ? 'text-emerald-400' : 'text-amber-400'}>
                {signalArray.nodesPlacedCount}/3
              </strong>
            </span>
            <span>
              Power Cell:{' '}
              <strong className={signalArray.powerCellInserted ? 'text-emerald-400' : 'text-rose-400'}>
                {signalArray.powerCellInserted ? 'INSTALLED' : 'MISSING'}
              </strong>
            </span>
          </div>
        </div>

        {/* 2-Column Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden flex-1 min-h-[380px]">
          {/* Left Column: Landmark Waypoint Navigation List */}
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 max-h-[50vh] md:max-h-full scrollbar-thin">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Plot Waypoints & Signals:
            </div>
            {locations.map((loc, idx) => {
              const isSelected = loc.id === selectedId;
              const isTracked = loc.id === signalArray.activeLocationId;

              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedId(loc.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-md'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{loc.icon}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{loc.name}</span>
                        {loc.restored && <span className="text-emerald-400 text-[10px]">✓</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{loc.frequency.toFixed(1)} MHz</div>
                    </div>
                  </div>

                  {isTracked && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                      TRACKING
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Landmark Lore & Frequency Details */}
          <div className="md:col-span-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-full scrollbar-thin gap-4">
            <div className="flex flex-col gap-3">
              {/* Landmark Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-4xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {selectedLoc.icon}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <span>{selectedLoc.name}</span>
                      {selectedLoc.restored && (
                        <span className="text-xs font-normal bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                          Restored
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium">{selectedLoc.tagline}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {selectedLoc.frequency.toFixed(1)} MHz
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    ({selectedLoc.x}, {selectedLoc.z})
                  </div>
                </div>
              </div>

              {/* Mission Objective */}
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wide mb-1">
                  Objective Directive:
                </div>
                <p className="text-slate-300 leading-relaxed">{selectedLoc.objective}</p>
              </div>

              {/* Transcribed Lore Logs */}
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Recovered Historic Transmissions:
                </div>
                {selectedLoc.loreLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">📻 {log.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 italic">Source: {log.source}</div>
                    <div className="text-xs text-slate-300 space-y-1.5 mt-1 border-t border-slate-800/60 pt-2 font-serif">
                      {log.fullText.map((paragraph, pIdx) => (
                        <p key={pIdx} className="leading-relaxed">
                          "{paragraph}"
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions: Tune Frequency & Compass Pin */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400">
                {selectedLoc.id === signalArray.activeLocationId ? (
                  <span className="text-emerald-400 font-bold">✓ Active on Vessel Radar</span>
                ) : (
                  <span>Ready to align receiver frequency</span>
                )}
              </span>

              <button
                onClick={() => onTuneFrequency(selectedLoc.frequency)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-700/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>📡</span>
                <span>Tune Radar to {selectedLoc.frequency.toFixed(1)} MHz</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
