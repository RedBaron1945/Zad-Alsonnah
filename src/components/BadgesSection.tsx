import React, { useState } from 'react';
import { Badge, BadgeTier } from '../types';
import {
  Award,
  Flame,
  Sparkles,
  CheckCircle2,
  Footprints,
  CalendarCheck,
  Compass,
  ShieldCheck,
  Crown,
  Lock,
  Trophy,
  Info,
  X,
  Check,
  Zap,
  Target,
  Medal,
  Star,
} from 'lucide-react';

interface BadgesSectionProps {
  badges: Badge[];
  currentStreak: number;
  maxStreak: number;
  distinctDaysCount: number;
}

export const BadgesSection: React.FC<BadgesSectionProps> = ({
  badges,
  currentStreak,
  maxStreak,
  distinctDaysCount,
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'unlocked' | 'in_progress'>('all');
  const [activeBadgeModal, setActiveBadgeModal] = useState<Badge | null>(null);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const filteredBadges = badges.filter((b) => {
    if (selectedTab === 'unlocked') return b.unlocked;
    if (selectedTab === 'in_progress') return !b.unlocked;
    return true;
  });

  const getBadgeIcon = (iconName: string, unlocked: boolean, tier: BadgeTier) => {
    const iconClass = `w-6 h-6 sm:w-7 sm:h-7 ${
      unlocked ? 'stroke-[2.2]' : 'text-gray-400 stroke-[1.8]'
    }`;

    switch (iconName) {
      case 'Footprints':
        return <Footprints className={iconClass} />;
      case 'Flame':
        return <Flame className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={iconClass} />;
      case 'CalendarCheck':
        return <CalendarCheck className={iconClass} />;
      case 'Compass':
        return <Compass className={iconClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={iconClass} />;
      case 'Crown':
        return <Crown className={iconClass} />;
      case 'Zap':
        return <Zap className={iconClass} />;
      case 'Target':
        return <Target className={iconClass} />;
      case 'Medal':
        return <Medal className={iconClass} />;
      case 'Star':
        return <Star className={iconClass} />;
      default:
        return <Award className={iconClass} />;
    }
  };

  const getTierStyling = (tier: BadgeTier, unlocked: boolean) => {
    if (!unlocked) {
      return {
        cardBg: 'bg-gray-50/80 border-gray-200 text-gray-400',
        iconBg: 'bg-gray-100 text-gray-400 border-gray-200',
        badgePill: 'bg-gray-100 text-gray-500 border-gray-200',
        tierLabel: 'مغلق',
      };
    }

    switch (tier) {
      case 'diamond':
        return {
          cardBg: 'bg-gradient-to-br from-indigo-50/90 via-blue-50/80 to-purple-50/70 border-indigo-200 text-indigo-950 shadow-xs',
          iconBg: 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white border-indigo-300 shadow-xs',
          badgePill: 'bg-indigo-100/90 text-indigo-800 border-indigo-300',
          tierLabel: 'وسام ألماسي',
        };
      case 'emerald':
        return {
          cardBg: 'bg-gradient-to-br from-emerald-50/90 via-teal-50/80 to-green-50/70 border-emerald-200 text-emerald-950 shadow-xs',
          iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-emerald-300 shadow-xs',
          badgePill: 'bg-emerald-100/90 text-emerald-800 border-emerald-300',
          tierLabel: 'وسام زمردي',
        };
      case 'gold':
        return {
          cardBg: 'bg-gradient-to-br from-amber-50/90 via-yellow-50/80 to-orange-50/70 border-amber-200 text-amber-950 shadow-xs',
          iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 border-amber-300 shadow-xs',
          badgePill: 'bg-amber-100/90 text-amber-800 border-amber-300',
          tierLabel: 'وسام ذهبي',
        };
      case 'silver':
        return {
          cardBg: 'bg-gradient-to-br from-blue-50/90 via-sky-50/80 to-cyan-50/70 border-blue-200 text-blue-950 shadow-xs',
          iconBg: 'bg-gradient-to-tr from-blue-600 to-sky-400 text-white border-blue-300 shadow-xs',
          badgePill: 'bg-blue-100/90 text-blue-800 border-blue-300',
          tierLabel: 'وسام فضي',
        };
      case 'bronze':
      default:
        return {
          cardBg: 'bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-warmGray-50 border-orange-200/80 text-orange-950 shadow-2xs',
          iconBg: 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white border-orange-300 shadow-2xs',
          badgePill: 'bg-orange-100/90 text-orange-800 border-orange-200',
          tierLabel: 'وسام برونزي',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-gray-200 shadow-2xs space-y-6">
      {/* Top Banner: Streaks & Badges Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 flex items-center justify-center shadow-xs">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-gray-900">
                لوحة الأوسمة والإنجازات النبوية
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">
                {unlockedCount} من {badges.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              أوسمة تُمنح للمواظبة اليومية المتتالية وإتمام أسابيع ومراحل برنامج زاد السنة
            </p>
          </div>
        </div>

        {/* Consecutive Streak Pill Highlight */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-orange-800 font-bold block">
                المواظبة المتتالية
              </span>
              <span className="text-sm font-black text-orange-950">
                {currentStreak} {currentStreak === 1 ? 'يوم' : currentStreak === 2 ? 'يومان' : 'أيام'}{' '}
                {currentStreak >= 3 && <span className="text-xs text-orange-600">🔥</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedTab === 'all'
                ? 'bg-white text-gray-900 shadow-2xs font-black'
                : 'hover:text-gray-900'
            }`}
          >
            جميع الأوسمة ({badges.length})
          </button>
          <button
            onClick={() => setSelectedTab('unlocked')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedTab === 'unlocked'
                ? 'bg-white text-emerald-800 shadow-2xs font-black'
                : 'hover:text-emerald-700'
            }`}
          >
            الأوسمة المحققة ({unlockedCount})
          </button>
          <button
            onClick={() => setSelectedTab('in_progress')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedTab === 'in_progress'
                ? 'bg-white text-blue-800 shadow-2xs font-black'
                : 'hover:text-blue-700'
            }`}
          >
            قيد الإنجاز ({badges.length - unlockedCount})
          </button>
        </div>

        <span className="text-[11px] text-gray-400 font-medium">
          انقر على أي وسام لمعرفة تفاصيل تحقيقه
        </span>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredBadges.map((badge) => {
          const styling = getTierStyling(badge.tier, badge.unlocked);
          const percent = Math.min(
            100,
            Math.round((badge.currentProgress / badge.targetProgress) * 100)
          );

          return (
            <div
              key={badge.id}
              onClick={() => setActiveBadgeModal(badge)}
              className={`relative p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${styling.cardBg}`}
            >
              {/* Top Row: Icon + Badge Pill */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${styling.iconBg}`}
                >
                  {getBadgeIcon(badge.iconName, badge.unlocked, badge.tier)}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${styling.badgePill}`}
                  >
                    {badge.unlocked ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        {styling.tierLabel}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        {styling.tierLabel}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h4
                className={`text-sm font-black mb-1 ${
                  badge.unlocked ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {badge.title}
              </h4>
              <p
                className={`text-xs line-clamp-2 leading-relaxed mb-3 ${
                  badge.unlocked ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {badge.description}
              </p>

              {/* Progress Bar & Status */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-bold">
                  <span className={badge.unlocked ? 'text-emerald-700' : 'text-gray-500'}>
                    {badge.unlocked ? 'تم الإنجاز بحمد الله' : 'التقدم المستمر'}
                  </span>
                  <span className={badge.unlocked ? 'text-emerald-800' : 'text-gray-600'}>
                    {badge.currentProgress} / {badge.targetProgress} {badge.unit}
                  </span>
                </div>

                <div className="w-full h-2 bg-gray-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.unlocked
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {activeBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full p-6 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                تفاصيل الوسام
              </span>
              <button
                onClick={() => setActiveBadgeModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-4">
              <div
                className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-3 border shadow-xs ${
                  getTierStyling(activeBadgeModal.tier, activeBadgeModal.unlocked).iconBg
                }`}
              >
                {getBadgeIcon(
                  activeBadgeModal.iconName,
                  activeBadgeModal.unlocked,
                  activeBadgeModal.tier
                )}
              </div>

              <h3 className="text-lg font-black text-gray-900 mb-1">
                {activeBadgeModal.title}
              </h3>

              <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700 mb-3">
                {activeBadgeModal.unlocked ? (
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    تم الحصول على هذا الوسام المبارك
                  </span>
                ) : (
                  <span className="text-gray-600 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    وسام قيد التحقيق والمواظبة
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100">
                {activeBadgeModal.description}
              </p>
            </div>

            {/* Target Progress in Modal */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 mb-4">
              <div className="flex justify-between text-xs font-black text-blue-900 mb-1.5">
                <span>المستوى الحالي</span>
                <span>
                  {activeBadgeModal.currentProgress} من {activeBadgeModal.targetProgress}{' '}
                  {activeBadgeModal.unit}
                </span>
              </div>
              <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (activeBadgeModal.currentProgress /
                          activeBadgeModal.targetProgress) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-blue-700 mt-2 font-medium">
                {activeBadgeModal.unlocked
                  ? 'تهانينا! استمر في المحافظة على السنن والأحاديث النبوية.'
                  : `يتبقى لك إنجاز ${Math.max(
                      0,
                      activeBadgeModal.targetProgress - activeBadgeModal.currentProgress
                    )} ${activeBadgeModal.unit} للحصول على هذا الوسام.`}
              </p>
            </div>

            <button
              onClick={() => setActiveBadgeModal(null)}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
