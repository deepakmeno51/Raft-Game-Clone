import React from 'react';
import { Achievement } from '../types/game';
import { Trophy, CheckCircle2, X } from 'lucide-react';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  onViewAchievements?: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onDismiss,
  onViewAchievements,
}) => {
  return (
    <div
      role="alert"
      className="pointer-events-auto w-84 sm:w-96 p-4 rounded-2xl bg-slate-950/95 border border-amber-400/40 shadow-[0_12px_40px_rgba(245,158,11,0.22)] backdrop-blur-md text-white flex items-start gap-3.5 transition-all duration-300 animate-in fade-in slide-in-from-top-4 select-none"
    >
      {/* Golden Laurel / Trophy Icon Frame */}
      <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
        <span className="text-2xl leading-none" role="img" aria-label="achievement">
          {achievement.icon || '🏆'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-0.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Achievement Unlocked</span>
        </div>

        <h4 className="text-sm font-bold text-white truncate leading-snug">
          {achievement.title}
        </h4>

        <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
          {achievement.description}
        </p>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Milestone Completed</span>
          </div>

          {onViewAchievements && (
            <button
              onClick={onViewAchievements}
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
            >
              View Journal &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
