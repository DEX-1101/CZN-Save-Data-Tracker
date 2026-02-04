import { Analytics } from '@vercel/analytics/react';
import React, { useState, useMemo, useEffect } from 'react';
import type { CalculatorState } from './types';
import { DEFAULT_POINTS, calculateDuplicationPoints, calculateTierLimit, TIER_OPTIONS } from './constants';

type Rules = typeof DEFAULT_POINTS;

const translations = {
  en: {
    app: {
      description: 'A tool to calculate and track your Faint Memory points to control which card you want to keep in your deck. Enter your card counts for the Combatant to see if you are hitting the save data limit or not. Tools based on this ',
      redditLinkText: 'reddit post',
      howToUse: 'How To Use',
      readRules: 'Read the RULES here',
      editRule: 'Edit Point Rule',
      updateLog: 'Update Log',
      githubTooltip: 'Feel free to create an issue if something wrong/missing',
    },
    calculator: {
      placeholder: 'Combatant Name',
      resetTooltip: 'Reset Fields',
      removeTooltip: 'Remove Combatant',
      addTooltip: 'Add Combatant',
      limitExceeded: 'Limit Exceeded',
      limitReached: 'Limit Reached',
      deckNotSavedWarning: 'Your deck might not be fully saved',
      statusOk: 'OK',
      statusPerfect: 'Perfect',
      tierPrefix: 'Tier',
      faintMemory: 'Faint Memory:',
      pointsSuffix: 'Points',
      saveDataLimit: 'Save Data Limit:',
      totalPrefix: 'Total:',
      saveDataTier: 'Save Data Tier:',
      pointOverflow: (points: number) => `${points} pts overflow`,
      tooltips: {
        neutralCard: (points: number) => <>{`${points} points per card.`}<br/><br/>A general card that can be found in the shop or from events. Check the in-game card gallery if you're not sure.</>,
        monsterCardNormal: (points: number) => <>{`${points} points per card.`}<br/><br/><strong>Normal</strong> Rarity Monster Card obtained by defeating an <strong>Elite Boss</strong>.</>,
        monsterCardRare: (points: number) => <>{`${points} points per card.`}<br/><br/><strong>Rare</strong> Rarity Monster Card obtained by defeating an <strong>Elite Boss</strong>.</>,
        monsterCardLegendary: (points: number) => <>{`${points} points per card.`}<br/><br/><strong>Legendary</strong> Rarity Monster Card obtained by defeating an <strong>Elite Boss</strong>.</>,
        divineEpiphany: (points: number) => <>{`${points} points per card.`}<br/><br/>Any <strong>Divine Epiphany</strong> upgrade on <strong>All Cards</strong> in your deck.</>,
        forbiddenCard: (points: number) => <>{`${points} points per card.`}<br/><br/>A card obtained from a <strong>chaos event</strong>. These cards will always be saved, based on the in-game description.</>,
        godsHammer: (points: number) => <>{`${points} points per refinement.`}<br/><br/>Points for <strong>Equipment Refinement</strong> (both Normal and God's Hammer).</>,
        startingCardRemoved: (points: number) => <>{`${points} points per card.`}<br/><br/>Only counts for removing/converting <strong>Starting Cards</strong> (the first 4 combatant cards).<br/>Removing/converting other cards costs 0.<br/>Max 5 removals allowed.</>,
        cardDuplication: <>{`0, 0, 40, 40 pts sequence.`}<br/><br/>Points for duplicated cards. Max 4 duplicates allowed.<br/>Removing a duplicated card does not grant points.</>,
      },
    },
    settings: {
      title: 'Edit Point Rules',
      close: 'Close settings',
      cardPointsHeader: 'Card Points',
      reset: 'Reset to Default',
      done: 'Done',
    },
    confirmation: {
      title: 'Remove Combatant?',
      message: 'This combatant has modified data. Are you sure you want to remove it? This action cannot be undone.',
      cancel: 'Cancel',
      remove: 'Remove',
    },
    updateLog: {
      title: 'Update Log',
      refresh: 'Refresh Log',
      close: 'Close update log',
      failed: 'Failed to Load Updates',
      tryAgain: 'Try Again',
      done: 'Done',
    },
  },
  id: {
    app: {
      description: 'Alat untuk menghitung dan melacak poin Faint Memory untuk mengontrol kartu mana yang ingin disimpan di deck. Masukkan jumlah kartu untuk Combatant untuk melihat apakah mencapai batas save data atau tidak. Alat ini berdasarkan ',
      redditLinkText: 'postingan reddit',
      howToUse: 'Cara Menggunakan',
      readRules: 'Baca Aturan di Sini',
      editRule: 'Edit Point Rule',
      updateLog: 'Update Log',
      githubTooltip: 'Jangan ragu untuk membuat issue di github jika ada yang salah/aneh',
    },
    calculator: {
      placeholder: 'Nama Combatant',
      resetTooltip: 'Reset Isian',
      removeTooltip: 'Hapus Combatant',
      addTooltip: 'Tambah Combatant',
      limitExceeded: 'Batas Terlampaui',
      limitReached: 'Batas Tercapai',
      deckNotSavedWarning: 'Deck mungkin tidak tersimpan sepenuhnya',
      statusOk: 'OK',
      statusPerfect: 'Perfect',
      tierPrefix: 'Tier',
      faintMemory: 'Faint Memory:',
      pointsSuffix: 'Poin',
      saveDataLimit: 'Batas Save Data:',
      totalPrefix: 'Total:',
      saveDataTier: 'Save Data Tier:',
      pointOverflow: (points: number) => `${points} poin lebih`,
      tooltips: {
        neutralCard: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Kartu umum yang bisa ditemukan di toko atau dari event. Periksa galeri kartu di dalam game jika tidak yakin.</>,
        monsterCardNormal: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Kartu Monster Rarity <strong>Normal</strong> yang didapat dengan mengalahkan <strong>Elite Boss</strong>.</>,
        monsterCardRare: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Kartu Monster Rarity <strong>Rare</strong> yang didapat dengan mengalahkan <strong>Elite Boss</strong>.</>,
        monsterCardLegendary: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Kartu Monster Rarity <strong>Legendary</strong> yang didapat dengan mengalahkan <strong>Elite Boss</strong>.</>,
        divineEpiphany: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Setiap upgrade <strong>Divine Epiphany</strong> pada <strong>Semua Kartu</strong> di dalam deck.</>,
        forbiddenCard: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Kartu yang didapat dari <strong>chaos event</strong>. Kartu-kartu ini akan selalu tersimpan, berdasarkan deskripsi di dalam game.</>,
        godsHammer: (points: number) => <>{`${points} poin per refinement.`}<br/><br/>Poin untuk <strong>Equipment Refinement</strong> (Normal dan God's Hammer).</>,
        startingCardRemoved: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Hanya dihitung untuk penghapusan/konversi <strong>Starting Cards</strong> (4 kartu awal combatant).<br/>Menghapus/konversi kartu lain biayanya 0.<br/>Maksimal 5 penghapusan.</>,
        cardDuplication: <>{`Urutan 0, 0, 40, 40 poin.`}<br/><br/>Poin untuk kartu duplikat. Maksimal 4 duplikat.<br/>Menghapus kartu duplikat tidak memberikan poin.</>,
      },
    },
    settings: {
      title: 'Edit Aturan Poin',
      close: 'Tutup pengaturan',
      cardPointsHeader: 'Poin Kartu',
      reset: 'Reset ke Default',
      done: 'Selesai',
    },
    confirmation: {
      title: 'Hapus Combatant?',
      message: 'Combatant ini memiliki data yang telah diubah. Apakah Anda yakin ingin menghapusnya? Tindakan ini tidak dapat dibatalkan.',
      cancel: 'Batal',
      remove: 'Hapus',
    },
    updateLog: {
      title: 'Log Pembaruan',
      refresh: 'Segarkan Log',
      close: 'Tutup log pembaruan',
      failed: 'Gagal Memuat Pembaruan',
      tryAgain: 'Coba Lagi',
      done: 'Selesai',
    },
  },
};

type Language = keyof typeof translations;
type TranslationSet = typeof translations.en;

// Helper component for tooltips
interface TooltipProps {
  text: React.ReactNode;
  children: React.ReactNode;
  align?: 'center' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, align = 'center' }) => {
  const positionClasses = {
    center: 'left-1/2 -translate-x-1/2',
    left: 'left-0',
    right: 'right-0',
  };
  
  return (
    <div className="relative flex items-center group">
      {children}
      <div className={`absolute bottom-full ${positionClasses[align]} mb-2 w-max max-w-[90vw] sm:max-w-xs p-2 text-xs text-white bg-black/90 backdrop-blur-md border border-white/10 rounded-md shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 invisible group-hover:visible group-focus-within:visible z-10 pointer-events-none`}>
        {text}
      </div>
    </div>
  );
};

const ChevronUp = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 15l-6-6-6 6"/>
    </svg>
);
  
const ChevronDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
);

// Helper component for number inputs with steppers
interface NumberInputProps {
  id: string; // Unique id for the input
  label: React.ReactNode; // Label can now be a React node (e.g., for multi-line)
  value: number;
  onValueChange: (newValue: number) => void;
  tooltipText?: React.ReactNode;
  ariaLabel?: string; // Explicit aria-label for screen readers if label is complex
  isOverLimit: boolean;
  isPerfect?: boolean;
  max?: number;
  limitReachedText?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ id, label, value, onValueChange, tooltipText, ariaLabel, isOverLimit, isPerfect, max, limitReachedText }) => {
  const [showLimit, setShowLimit] = useState(false);

  useEffect(() => {
    if (showLimit) {
      const timer = setTimeout(() => setShowLimit(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showLimit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
        if (max !== undefined && numValue > max) {
            onValueChange(max);
            setShowLimit(true);
        } else {
            onValueChange(numValue);
        }
    } else if (e.target.value === '') {
      onValueChange(0);
    }
  };

  const adjustValue = (amount: number) => {
    const newValue = value + amount;
    if (newValue < 0) return;
    if (max !== undefined && newValue > max) {
        setShowLimit(true);
        return;
    }
    onValueChange(newValue);
  };
  
  const finalAriaLabel = ariaLabel || (typeof label === 'string' ? label : id);
  const notificationText = limitReachedText || 'Limit Reached';

  const getBorderClasses = () => {
    if (value > 0) {
        if (isOverLimit) {
            return 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20';
        }
        if (isPerfect) {
            return 'border-green-500 focus-within:border-green-500 focus-within:ring-green-500/20';
        }
        return 'border-blue-500 focus-within:border-blue-500 focus-within:ring-blue-500/20';
    }
    return 'border-white/5 focus-within:border-blue-500 focus-within:ring-blue-500/20';
  };

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 h-12">
       <div className="flex items-center gap-1.5">
            {tooltipText && (
              <Tooltip text={tooltipText} align="left">
                <button type="button" className="p-1 text-slate-500 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-help rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg-color)] focus:ring-[var(--accent-color)]" aria-label={`Help for ${finalAriaLabel}`}>
                  <QuestionIcon />
                </button>
              </Tooltip>
            )}
            <label htmlFor={id} className="text-slate-300 text-sm leading-tight text-left">
              {label}
            </label>
        </div>
      <div className={`flex items-center flex-shrink-0 bg-[var(--input-bg)] rounded-lg border transition-colors duration-300 focus-within:ring-1 ${getBorderClasses()} relative`}>
        {showLimit && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20 fade-in">
                {notificationText}
            </div>
        )}
        <button onClick={() => adjustValue(-1)} className="h-10 w-9 flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/5 rounded-l-lg transition-colors" aria-label={`Decrease ${finalAriaLabel}`}>
          <ChevronDown />
        </button>
        <input
          id={id}
          type="number"
          value={value}
          onChange={handleInputChange}
          min="0"
          max={max}
          className="w-16 bg-transparent text-white p-2 text-center focus:outline-none"
        />
        <button onClick={() => adjustValue(1)} className="h-10 w-9 flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/5 rounded-r-lg transition-colors" aria-label={`Increase ${finalAriaLabel}`}>
          <ChevronUp />
        </button>
      </div>
    </div>
  );
};


// Component for a single calculator instance
interface CalculatorInstanceProps {
    instanceIndex: number;
    values: CalculatorState;
    onValueChange: <K extends keyof CalculatorState>(field: K, value: CalculatorState[K]) => void;
    onReset: () => void;
    rules: Rules;
    isLast: boolean;
    onAdd: () => void;
    onRemove: () => void;
    canAdd: boolean;
    canRemove: boolean;
    t: TranslationSet;
}

const ResetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1 -1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
    </svg>
);

const MinusIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
    </svg>
);

const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
    </svg>
);

const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
  </svg>
);

const QuestionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
    </svg>
);

const RulesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.823c-.908-.348-2.108-.733-3.287-.81-1.094-.08-2.28.06-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.347-.82 3.824-.918 1.477-.098 2.835.176 3.714.715a.5.5 0 0 0 .293 0c.879-.54 2.237-.813 3.714-.715 1.477.098 2.942.518 3.824.918a.5.5 0 0 0 .707-.455v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
    </svg>
);


const CalculatorInstance: React.FC<CalculatorInstanceProps> = ({ instanceIndex, values, onValueChange, onReset, rules, isLast, onAdd, onRemove, canAdd, canRemove, t }) => {
    const totalPoints = useMemo(() => {
        return (
            values.neutralCard * rules.NEUTRAL_CARD +
            values.monsterCardNormal * rules.MONSTER_CARD_NORMAL +
            values.monsterCardRare * rules.MONSTER_CARD_RARE +
            values.monsterCardLegendary * rules.MONSTER_CARD_LEGENDARY +
            values.divineEpiphany * rules.DIVINE_EPIPHANY +
            values.forbiddenCard * rules.FORBIDDEN_CARD +
            values.startingCardRemoved * rules.STARTING_CARD_REMOVED +
            calculateDuplicationPoints(values.cardDuplication) +
            values.godsHammer * rules.GODS_HAMMER
        );
    }, [values, rules]);

    const tierLimit = useMemo(() => {
        return calculateTierLimit(values.mapTier);
    }, [values.mapTier]);

    const isWithinLimit = totalPoints <= tierLimit;
    const isPerfect = totalPoints === tierLimit;

    // Define colors based on status
    const accentColorBg = !isWithinLimit ? 'bg-red-500' : (isPerfect ? 'bg-green-500' : 'bg-blue-500');
    const focusRingColor = !isWithinLimit ? 'focus:ring-red-500/50' : (isPerfect ? 'focus:ring-green-500/50' : 'focus:ring-blue-500/50');
    
    const progress = tierLimit > 0 ? Math.min((totalPoints / tierLimit) * 100, 100) : 0;
    
    const handleTierChange = (increment: number) => {
        const newTier = values.mapTier + increment;
        if (newTier >= TIER_OPTIONS[0] && newTier <= TIER_OPTIONS[TIER_OPTIONS.length - 1]) {
            onValueChange('mapTier', newTier);
        }
    };

    return (
        <div className="card-container relative w-full max-w-2xl rounded-r-2xl border-l-0 shadow-2xl p-6 flex flex-col gap-4 transition-all duration-300 md:hover:scale-[1.02] md:hover:shadow-[0_0_30px_rgba(0,120,212,0.2)] fade-in">
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${accentColorBg}`}></div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative w-full sm:flex-grow">
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${accentColorBg} z-10`}></div>
                    <input
                        type="text"
                        value={values.characterName}
                        onChange={(e) => onValueChange('characterName', e.target.value)}
                        className={`w-full bg-[var(--input-bg)] text-white rounded-r-lg py-3 pr-3 pl-5 focus:outline-none focus:ring-1 ${focusRingColor} transition duration-300 text-lg font-semibold placeholder-slate-500`}
                        placeholder={t.calculator.placeholder}
                    />
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <Tooltip text={t.calculator.resetTooltip} align="right">
                        <button
                            onClick={onReset}
                            className="p-3 flex-shrink-0 rounded-lg text-slate-400 hover:text-white bg-[var(--input-bg)] hover:bg-white/10 transition-colors duration-200"
                            aria-label="Reset fields"
                        >
                            <ResetIcon />
                        </button>
                    </Tooltip>
                    {isLast && (
                        <>
                            <Tooltip text={t.calculator.removeTooltip} align="right">
                                <button
                                    onClick={onRemove}
                                    disabled={!canRemove}
                                    className="p-3 flex-shrink-0 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Remove last combatant"
                                >
                                    <MinusIcon />
                                </button>
                            </Tooltip>
                            <Tooltip text={t.calculator.addTooltip} align="right">
                                <button
                                    onClick={onAdd}
                                    disabled={!canAdd}
                                    className="p-3 flex-shrink-0 rounded-lg bg-green-500/10 text-green-300 hover:bg-green-500/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Add new combatant"
                                >
                                <PlusIcon />
                                </button>
                            </Tooltip>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <label htmlFor={`map-tier-${values.characterName}`} className="text-slate-300 text-sm font-medium whitespace-nowrap">{t.calculator.saveDataTier}</label>
                <div className="flex items-center flex-grow bg-[var(--input-bg)] rounded-lg border border-slate-700 focus-within:border-[var(--accent-color)] focus-within:ring-1 focus-within:ring-[var(--accent-color)]/50 transition-colors duration-300">
                     <button
                        onClick={() => handleTierChange(-1)}
                        disabled={values.mapTier <= TIER_OPTIONS[0]}
                        className="h-10 w-9 flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/5 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Decrease Save Data Tier"
                    >
                        <ChevronDown />
                    </button>
                    <select
                        id={`map-tier-${values.characterName}`}
                        value={values.mapTier}
                        onChange={(e) => onValueChange('mapTier', parseInt(e.target.value, 10))}
                        className="flex-grow bg-transparent text-white py-2 focus:outline-none transition appearance-none text-center cursor-pointer"
                    >
                        {TIER_OPTIONS.map((tier) => (
                            <option key={tier} value={tier} className="bg-slate-900 text-white">{t.calculator.tierPrefix} {tier}</option>
                        ))}
                    </select>
                     <button
                        onClick={() => handleTierChange(1)}
                        disabled={values.mapTier >= TIER_OPTIONS[TIER_OPTIONS.length - 1]}
                        className="h-10 w-9 flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/5 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Increase Save Data Tier"
                    >
                        <ChevronUp />
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <NumberInput isOverLimit={!isWithinLimit} isPerfect={isPerfect} id={`neutral-card-${instanceIndex}`} label="Neutral Card" value={values.neutralCard} onValueChange={(v) => onValueChange('neutralCard', v)} tooltipText={t.calculator.tooltips.neutralCard(rules.NEUTRAL_CARD)} limitReachedText={t.calculator.limitReached} />
                    <NumberInput 
                        isOverLimit={!isWithinLimit} 
                        isPerfect={isPerfect} 
                        id={`monster-normal-${instanceIndex}`} 
                        label={<span>Monster Card <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-white to-slate-400 bg-[length:200%_auto] animate-shimmer">(Normal)</span></span>} 
                        value={values.monsterCardNormal} 
                        onValueChange={(v) => onValueChange('monsterCardNormal', v)} 
                        tooltipText={t.calculator.tooltips.monsterCardNormal(rules.MONSTER_CARD_NORMAL)} 
                        limitReachedText={t.calculator.limitReached}
                    />
                    <NumberInput 
                        isOverLimit={!isWithinLimit} 
                        isPerfect={isPerfect} 
                        id={`monster-rare-${instanceIndex}`} 
                        label={<span>Monster Card <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 bg-[length:200%_auto] animate-shimmer">(Rare)</span></span>} 
                        value={values.monsterCardRare} 
                        onValueChange={(v) => onValueChange('monsterCardRare', v)} 
                        tooltipText={t.calculator.tooltips.monsterCardRare(rules.MONSTER_CARD_RARE)} 
                        limitReachedText={t.calculator.limitReached}
                    />
                    <NumberInput 
                        isOverLimit={!isWithinLimit} 
                        isPerfect={isPerfect} 
                        id={`monster-legendary-${instanceIndex}`} 
                        label={
                            <span>
                                Monster Card <span className="font-bold text-transparent bg-clip-text bg-[linear-gradient(to_right,#ff66cc,#a855f7,#3b82f6,#22d3ee,#facc15,#ff66cc,#a855f7,#3b82f6)] bg-[length:200%_auto] animate-shimmer drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">(Legendary)</span>
                            </span>
                        } 
                        value={values.monsterCardLegendary} 
                        onValueChange={(v) => onValueChange('monsterCardLegendary', v)} 
                        tooltipText={t.calculator.tooltips.monsterCardLegendary(rules.MONSTER_CARD_LEGENDARY)} 
                        limitReachedText={t.calculator.limitReached}
                    />
                    <NumberInput isOverLimit={!isWithinLimit} isPerfect={isPerfect} id={`forbidden-card-${instanceIndex}`} label="Forbidden Card" value={values.forbiddenCard} onValueChange={(v) => onValueChange('forbiddenCard', v)} tooltipText={t.calculator.tooltips.forbiddenCard(rules.FORBIDDEN_CARD)} limitReachedText={t.calculator.limitReached} />
                </div>
                
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <NumberInput isOverLimit={!isWithinLimit} isPerfect={isPerfect} id={`divine-epiphany-${instanceIndex}`} label="Divine Epiphany" value={values.divineEpiphany} onValueChange={(v) => onValueChange('divineEpiphany', v)} tooltipText={t.calculator.tooltips.divineEpiphany(rules.DIVINE_EPIPHANY)} limitReachedText={t.calculator.limitReached} />
                    <NumberInput isOverLimit={!isWithinLimit} isPerfect={isPerfect} id={`gods-hammer-${instanceIndex}`} label="Equipment Refinement" value={values.godsHammer} onValueChange={(v) => onValueChange('godsHammer', v)} tooltipText={t.calculator.tooltips.godsHammer(rules.GODS_HAMMER)} limitReachedText={t.calculator.limitReached} />
                    <div className="h-px bg-white/10 my-1"></div>
                    <NumberInput isOverLimit={!isWithinLimit} isPerfect={isPerfect} id={`starting-removed-${instanceIndex}`} label="Starting Card Removed" value={values.startingCardRemoved} onValueChange={(v) => onValueChange('startingCardRemoved', v)} tooltipText={t.calculator.tooltips.startingCardRemoved(rules.STARTING_CARD_REMOVED)} max={5} limitReachedText={t.calculator.limitReached} />
                    <NumberInput isOverLimit={!isWithinLimit} isPerfect={isPerfect} id={`card-duplication-${instanceIndex}`} label="Card Duplication" value={values.cardDuplication} onValueChange={(v) => onValueChange('cardDuplication', v)} tooltipText={t.calculator.tooltips.cardDuplication} max={4} limitReachedText={t.calculator.limitReached} />
                </div>
            </div>
            
            <div className="mt-2 pt-4 border-t border-slate-700/50 flex flex-col gap-3">
                <div className="flex items-stretch gap-3 sm:gap-4">
                     {/* Status Bar with integrated Progress */}
                    <div className={`relative flex-grow flex items-center justify-center text-center font-bold text-lg border-l-2 overflow-hidden transition-colors duration-300 bg-[var(--input-bg)] ${!isWithinLimit ? 'border-red-500 text-red-300' : (isPerfect ? 'border-green-500 text-green-300' : 'border-blue-500 text-blue-300')}`}>
                         {/* Progress Fill */}
                         <div 
                            className={`absolute top-0 left-0 h-full transition-all duration-500 ${!isWithinLimit ? 'bg-red-500/20' : (isPerfect ? 'bg-green-500/20' : 'bg-blue-500/20')}`} 
                            style={{ width: `${progress}%` }}>
                        </div>

                         <div className="relative z-10 h-7 w-full overflow-hidden" aria-live="polite">
                            <div 
                                className={`absolute w-full top-0 left-0 transition-transform duration-500 ease-in-out ${
                                    !isWithinLimit 
                                        ? '-translate-y-[66.66%]' 
                                        : isPerfect 
                                            ? '-translate-y-[33.33%]' 
                                            : 'translate-y-0'
                                }`}
                                style={{ height: '300%' }}
                            >
                                <div className="h-1/3 flex items-center justify-center">
                                    <span>{t.calculator.statusOk}</span>
                                </div>
                                <div className="h-1/3 flex items-center justify-center">
                                    <span>{t.calculator.statusPerfect}</span>
                                </div>
                                <div className="h-1/3 flex items-center justify-center">
                                    <span>{t.calculator.limitExceeded}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Faint Memory Box */}
                    <div className={`flex flex-col justify-center py-1.5 px-3 bg-[var(--input-bg)] rounded-r-lg border-l-2 ${!isWithinLimit ? 'border-red-500' : (isPerfect ? 'border-green-500' : 'border-blue-500')} transition-colors duration-300 min-w-[80px]`}>
                         <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider mb-0.5 leading-none">
                            {t.calculator.faintMemory.replace(':', '')}
                        </span>
                        <div className="flex items-baseline whitespace-nowrap leading-none">
                             <span className={`text-base font-bold transition-colors duration-300 ${!isWithinLimit ? 'text-red-300' : (isPerfect ? 'text-green-300' : 'text-blue-300')}`}>
                                {totalPoints}
                            </span>
                            <span className="text-slate-400 mx-1 text-sm font-bold">/</span>
                            <span className="text-slate-200 text-base font-bold">{tierLimit}</span>
                        </div>
                    </div>
                </div>

                {!isWithinLimit && (
                    <div className="flex flex-col items-center justify-center gap-1 text-red-300 text-xs mt-1 fade-in">
                        <div className="flex items-center gap-2">
                            <WarningIcon />
                            <span>{t.calculator.deckNotSavedWarning}</span>
                        </div>
                        <span className="text-yellow-400 font-normal">{t.calculator.pointOverflow(totalPoints - tierLimit)}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Settings Modal Component
interface SettingsModalProps {
    rules: Rules;
    setRules: React.Dispatch<React.SetStateAction<Rules>>;
    onClose: () => void;
    t: TranslationSet;
}

const RuleInput: React.FC<{ label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, value, onChange }) => (
    <div className="grid grid-cols-[1fr_auto] items-center py-2 border-b border-slate-700/50 gap-4">
        <label className="text-slate-300">{label}</label>
        <input
            type="number"
            value={value}
            onChange={onChange}
            className="w-24 bg-[var(--input-bg)] text-white p-2 rounded-md border border-slate-600 focus:outline-none focus:border-[var(--accent-color)] focus:ring-1 focus:ring-[var(--accent-color)] text-center"
        />
    </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ rules, setRules, onClose, t }) => {
    const handleRuleChange = (ruleName: keyof Rules, value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            setRules(prev => ({ ...prev, [ruleName]: numValue }));
        } else if (value === '') {
            setRules(prev => ({ ...prev, [ruleName]: 0 }));
        }
    };

    const handleResetToDefault = () => {
        setRules(DEFAULT_POINTS);
    };
    
    // Explicit list to control order and excluding helper functions if any
    const displayRules: (keyof Rules)[] = [
        'NEUTRAL_CARD',
        'MONSTER_CARD_NORMAL',
        'MONSTER_CARD_RARE',
        'MONSTER_CARD_LEGENDARY',
        'DIVINE_EPIPHANY',
        'FORBIDDEN_CARD',
        'GODS_HAMMER',
        'STARTING_CARD_REMOVED'
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
            <div className="card-container w-full max-w-md rounded-2xl p-4 sm:p-6 flex flex-col gap-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
                <div className="flex justify-between items-center">
                    <h2 id="settings-title" className="text-xl font-bold text-white">{t.settings.title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 text-2xl leading-none rounded-full hover:bg-white/10 transition-colors" aria-label={t.settings.close}>&times;</button>
                </div>
                <div className="flex flex-col gap-2 max-h-[75vh] sm:max-h-[60vh] overflow-y-auto pr-2">
                    <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider">{t.settings.cardPointsHeader}</h3>
                    {displayRules.map((key) => (
                        <RuleInput
                            key={key}
                            label={key === 'GODS_HAMMER' ? 'Equipment Refinement' : key.replace(/_/g, ' ')}
                            value={rules[key] as number}
                            onChange={(e) => handleRuleChange(key, e.target.value)}
                        />
                    ))}
                    <p className="text-xs text-slate-500 mt-4 italic">
                        Note: Card Duplication logic (0,0,40,40) is fixed.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button onClick={handleResetToDefault} className="flex-1 p-3 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-colors duration-200 font-semibold">{t.settings.reset}</button>
                    <button onClick={onClose} className="flex-1 p-3 rounded-lg bg-blue-600/80 text-white hover:bg-blue-600/95 transition-colors duration-200 font-semibold">{t.settings.done}</button>
                </div>
            </div>
        </div>
    );
};

// Confirmation Modal Component
interface ConfirmationModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    t: TranslationSet;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ onConfirm, onCancel, t }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
            <div className="card-container w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 text-center" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
                <h2 id="confirm-title" className="text-xl font-bold text-white">{t.confirmation.title}</h2>
                <p className="text-slate-300 text-sm">
                    {t.confirmation.message}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button onClick={onCancel} className="flex-1 p-3 rounded-lg bg-slate-500/20 text-slate-300 hover:bg-slate-500/40 transition-colors duration-200 font-semibold">{t.confirmation.cancel}</button>
                    <button onClick={onConfirm} className="flex-1 p-3 rounded-lg bg-red-500/80 text-white hover:bg-red-500/95 transition-colors duration-200 font-semibold">{t.confirmation.remove}</button>
                </div>
            </div>
        </div>
    );
};

// Update Log Modal Component
interface UpdateLogModalProps {
    onClose: () => void;
    logContent: string;
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    t: TranslationSet;
}

const UpdateLogModal: React.FC<UpdateLogModalProps> = ({ onClose, logContent, isLoading, error, onRefresh, t }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
            <div className="card-container w-full max-w-lg rounded-2xl p-4 sm:p-6 flex flex-col gap-4" role="dialog" aria-modal="true" aria-labelledby="update-log-title">
                <div className="flex justify-between items-center">
                    <h2 id="update-log-title" className="text-xl font-bold text-white">{t.updateLog.title}</h2>
                    <div className="flex items-center gap-1">
                        <Tooltip text={t.updateLog.refresh}>
                            <button onClick={onRefresh} className={`text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-transform duration-500 ${isLoading ? 'animate-spin' : 'hover:scale-110'}`} aria-label={t.updateLog.refresh} disabled={isLoading}>
                                <ResetIcon />
                            </button>
                        </Tooltip>
                        <button onClick={onClose} className="text-slate-400 hover:text-white p-2 text-2xl leading-none rounded-full hover:bg-white/10 transition-colors" aria-label={t.updateLog.close}>&times;</button>
                    </div>
                </div>
                <div className="bg-[var(--input-bg)] rounded-lg p-4 max-h-[75vh] sm:max-h-[60vh] overflow-y-auto pr-2 border border-slate-700/50 min-h-[12rem] flex flex-col">
                    {isLoading ? (
                        <div className="flex-grow flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
                        </div>
                    ) : error ? (
                         <div className="flex-grow flex flex-col justify-center items-center text-center p-4">
                            <p className="text-red-400 font-semibold">{t.updateLog.failed}</p>
                            <p className="text-slate-400 text-xs mt-1">{error}</p>
                            <button onClick={onRefresh} className="mt-4 text-sm bg-red-500/20 text-red-300 hover:bg-red-500/40 px-4 py-2 rounded-lg transition-colors font-semibold">
                                {t.updateLog.tryAgain}
                            </button>
                        </div>
                    ) : (
                        <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{logContent}</pre>
                    )}
                </div>
                <div className="flex justify-end gap-4 mt-2">
                    <button onClick={onClose} className="w-full sm:w-auto p-3 px-8 rounded-lg bg-blue-600/80 text-white hover:bg-blue-600/95 transition-colors duration-200 font-semibold">{t.updateLog.done}</button>
                </div>
            </div>
        </div>
    );
};

const LanguageSwitch: React.FC<{
  language: Language;
  onLanguageChange: (lang: Language) => void;
}> = ({ language, onLanguageChange }) => {
  return (
    <div className="relative flex items-center bg-black/60 p-1 rounded-full border border-white/10 shadow-lg transform-gpu">
      <div
        className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-blue-600 rounded-full transition-transform duration-300 ease-in-out shadow-sm"
        style={{
          transform: language === 'en' ? 'translateX(100%)' : 'translateX(0)',
        }}
      />
      <button
        onClick={() => onLanguageChange('id')}
        aria-pressed={language === 'id'}
        className={`relative z-10 w-16 py-2 text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--input-bg)] focus-visible:ring-white/50 ${
          language === 'id' ? 'text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        ID
      </button>
      <button
        onClick={() => onLanguageChange('en')}
        aria-pressed={language === 'en'}
        className={`relative z-10 w-16 py-2 text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--input-bg)] focus-visible:ring-white/50 ${
          language === 'en' ? 'text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        ENG
      </button>
    </div>
  );
};


// Main App component
const App: React.FC = () => {
    const initialCalculatorState: Omit<CalculatorState, 'characterName'> = {
        mapTier: 1, 
        neutralCard: 0, 
        monsterCardNormal: 0,
        monsterCardRare: 0,
        monsterCardLegendary: 0,
        divineEpiphany: 0,
        forbiddenCard: 0, 
        startingCardRemoved: 0, 
        cardDuplication: 0,
        godsHammer: 0,
    };
    const defaultState: CalculatorState[] = [
        { ...initialCalculatorState, characterName: 'Combatant 1' },
    ];
    
    const STORAGE_KEYS = {
        CALCULATORS: 'czn_tracker_calculators_v3', // Version bump for new structure
        RULES: 'czn_tracker_rules_v3',
        LANGUAGE: 'czn_tracker_language'
    };

    const [calculators, setCalculators] = useState<CalculatorState[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.CALCULATORS);
            return saved ? JSON.parse(saved) : defaultState;
        } catch (e) {
            console.error("Failed to load calculators from local storage", e);
            return defaultState;
        }
    });

    const [rules, setRules] = useState<Rules>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.RULES);
            return saved ? JSON.parse(saved) : DEFAULT_POINTS;
        } catch (e) {
            console.error("Failed to load rules from local storage", e);
            return DEFAULT_POINTS;
        }
    });
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [isUpdateLogOpen, setIsUpdateLogOpen] = useState(false);

    const [logContent, setLogContent] = useState<string>('');
    const [isLogLoading, setIsLogLoading] = useState(false);
    const [logError, setLogError] = useState<string | null>(null);
    const [showGooner, setShowGooner] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (Date.now() - startTime >= 15 * 60 * 1000) { // 15 minutes
                setShowGooner(true);
                setTimeout(() => setAnimationComplete(true), 1000);
                clearInterval(interval);
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);

    const [language, setLanguage] = useState<Language>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
            return (saved === 'en' || saved === 'id') ? saved : 'en';
        } catch (e) {
             console.error("Failed to load language from local storage", e);
            return 'en';
        }
    });
    const t = useMemo(() => translations[language], [language]);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.CALCULATORS, JSON.stringify(calculators));
    }, [calculators]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
    }, [rules]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    }, [language]);

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
    };

    const handleCalculatorUpdate = (index: number) => <K extends keyof CalculatorState>(
        field: K,
        value: CalculatorState[K]
    ) => {
        setCalculators(prev => {
            const updatedCalculators = [...prev];
            updatedCalculators[index] = { ...updatedCalculators[index], [field]: value };
            return updatedCalculators;
        });
    };
    
    const handleReset = (index: number) => {
        setCalculators(prev => {
            const updatedCalculators = [...prev];
            updatedCalculators[index] = {
                characterName: updatedCalculators[index].characterName,
                ...initialCalculatorState,
                mapTier: updatedCalculators[index].mapTier,
            };
            return updatedCalculators;
        });
    };
    
    const addCalculator = () => {
        setCalculators(prev => {
            if (prev.length >= 6) return prev;
            const newCalculator: CalculatorState = {
                ...initialCalculatorState,
                characterName: `Combatant ${prev.length + 1}`,
            };
            return [...prev, newCalculator];
        });
    };

    const removeCalculator = () => {
        setCalculators(prev => {
            if (prev.length <= 1) return prev;
            return prev.slice(0, -1);
        });
    };
    
    const isCalculatorDirty = (calc: CalculatorState): boolean => {
        return (
            calc.mapTier !== initialCalculatorState.mapTier ||
            calc.neutralCard !== initialCalculatorState.neutralCard ||
            calc.monsterCardNormal !== initialCalculatorState.monsterCardNormal ||
            calc.monsterCardRare !== initialCalculatorState.monsterCardRare ||
            calc.monsterCardLegendary !== initialCalculatorState.monsterCardLegendary ||
            calc.divineEpiphany !== initialCalculatorState.divineEpiphany ||
            calc.forbiddenCard !== initialCalculatorState.forbiddenCard ||
            calc.startingCardRemoved !== initialCalculatorState.startingCardRemoved ||
            calc.cardDuplication !== initialCalculatorState.cardDuplication ||
            calc.godsHammer !== initialCalculatorState.godsHammer
        );
    };

    const handleAttemptRemove = () => {
        if (calculators.length <= 1) return;
        const lastCalculator = calculators[calculators.length - 1];
        if (isCalculatorDirty(lastCalculator)) {
            setShowRemoveConfirm(true);
        } else {
            removeCalculator();
        }
    };

    const fetchLog = async () => {
        setIsLogLoading(true);
        setLogError(null);
        try {
            // Add a cache-busting query param to ensure it's always fresh
            const response = await fetch(`https://raw.githubusercontent.com/DEX-1101/CZN-Save-Data-Tracker/refs/heads/main/update.txt?_=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            setLogContent(text);
        } catch (e) {
            console.error("Failed to fetch update log:", e);
            setLogError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLogLoading(false);
        }
    };

    const handleOpenUpdateLog = () => {
        fetchLog();
        setIsUpdateLogOpen(true);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="relative w-full pt-6 pb-6 sm:pt-10 sm:pb-8 px-6 text-center overflow-hidden isolate">
                 {/* Ambient Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />
                
                <div className="flex flex-col items-center">
                     {/* Main Title with Gradient and Shadow */}
                    <h1 className="relative z-10 flex flex-wrap justify-center items-center gap-2 text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-0 pb-2 sm:pb-4 drop-shadow-[0_0_25px_rgba(59,130,246,0.3)]">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-50 to-blue-300 leading-tight">
                            Chaos Zero
                        </span>
                        <div className="relative h-[1.25em] overflow-hidden">
                            {animationComplete ? (
                                <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-50 to-blue-300 leading-tight">
                                    Gooner
                                </span>
                            ) : (
                                <div className={`transition-transform duration-[1000ms] ease-in-out ${showGooner ? '-translate-y-1/2' : 'translate-y-0'} text-left`}>
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-50 to-blue-300 leading-tight">Nightmare</span>
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-50 to-blue-300 leading-tight">Gooner</span>
                                </div>
                            )}
                        </div>
                    </h1>
                    
                    {/* Subtitle with tracking */}
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400/90 tracking-[0.2em] uppercase mb-2 drop-shadow-md">
                        Save Data Tracker
                    </h2>

                     {/* Description */}
                    <div className="relative z-10 max-w-2xl mx-auto">
                         <div className="fluid-separator mx-auto mb-5"></div>
                        <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium">
                            {t.app.description}
                            <a 
                                href="https://www.reddit.com/r/ChaosZeroNightmare/comments/1ovg538/i_create_the_deck_builder_app_in_case_you_guys" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-400 hover:text-blue-300 transition-colors border-b border-blue-400/30 hover:border-blue-300 pb-0.5 ml-1"
                            >
                                {t.app.redditLinkText}
                            </a>.
                        </p>
                    </div>
                </div>
                
                 {/* Bottom Border Gradient */}
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
            </header>

            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 py-3 px-4">
                <a
                    href="https://raw.githubusercontent.com/DEX-1101/CZN-Save-Data-Tracker/refs/heads/main/exx.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black/60 border border-white/10 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600/20 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 font-medium active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transform-gpu"
                    aria-label="How To Use Guide"
                >
                    <QuestionIcon />
                    <span>{t.app.howToUse}</span>
                </a>
                <a
                    href="https://raw.githubusercontent.com/DEX-1101/CZN-Save-Data-Tracker/refs/heads/main/rule.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black/60 border border-white/10 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600/20 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 font-medium active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transform-gpu"
                    aria-label="Read the RULES here"
                >
                    <RulesIcon />
                    <span>{t.app.readRules}</span>
                </a>
                <LanguageSwitch language={language} onLanguageChange={handleLanguageChange} />
            </div>

            <main className="flex-grow text-white flex flex-wrap items-start justify-center px-4 pb-4 gap-4 sm:px-8 sm:pb-8 sm:gap-8">
                {calculators.map((calc, index) => (
                    <CalculatorInstance
                        key={index} // Using index is safe here as we only add/remove from the end.
                        instanceIndex={index}
                        values={calc}
                        onValueChange={handleCalculatorUpdate(index)}
                        onReset={() => handleReset(index)}
                        rules={rules}
                        isLast={index === calculators.length - 1}
                        onAdd={addCalculator}
                        onRemove={handleAttemptRemove}
                        canAdd={calculators.length < 6}
                        canRemove={calculators.length > 1}
                        t={t}
                    />
                ))}
            </main>

            <footer className="w-full p-6 flex justify-center">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-black/60 border border-white/10 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600/20 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 font-medium active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transform-gpu"
                        aria-label="Edit Point Rules"
                    >
                        {t.app.editRule}
                    </button>
                    <button
                        onClick={handleOpenUpdateLog}
                        className="relative group bg-black/60 border border-white/10 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600/20 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 font-medium active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transform-gpu"
                        aria-label="View Update Log"
                    >
                        {/* Inner animated border to prevent layer repaints on the blurred container */}
                        <span className="absolute inset-0 rounded-full border border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-pulse group-hover:opacity-0 transition-opacity duration-300 pointer-events-none"></span>
                        <span className="relative z-10">{t.app.updateLog}</span>
                    </button>
                     <Tooltip text={t.app.githubTooltip} align="right">
                        <a
                            href="https://github.com/DEX-1101/CZN-Save-Data-Tracker"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black/60 border border-white/10 text-white p-3 rounded-full shadow-lg hover:bg-blue-600/20 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 flex items-center justify-center active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                            aria-label="View source code on GitHub"
                        >
                            <GithubIcon />
                        </a>
                    </Tooltip>
                </div>
            </footer>

            {isSettingsOpen && (
                <SettingsModal rules={rules} setRules={setRules} onClose={() => setIsSettingsOpen(false)} t={t} />
            )}
            
            {showRemoveConfirm && (
                <ConfirmationModal
                    onConfirm={() => {
                        removeCalculator();
                        setShowRemoveConfirm(false);
                    }}
                    onCancel={() => setShowRemoveConfirm(false)}
                    t={t}
                />
            )}

            {isUpdateLogOpen && (
                <UpdateLogModal 
                    onClose={() => setIsUpdateLogOpen(false)} 
                    logContent={logContent}
                    isLoading={isLogLoading}
                    error={logError}
                    onRefresh={fetchLog}
                    t={t}
                />
            )}
          <Analytics />
        </div>
    );
};

export default App;
