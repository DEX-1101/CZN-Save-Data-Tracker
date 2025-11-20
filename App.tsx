
import { Analytics } from '@vercel/analytics/react';
import React, { useState, useMemo, useEffect } from 'react';
import type { CalculatorState } from './types';
import { DEFAULT_POINTS, calculateSpecialPoints, calculateTierLimit, TIER_OPTIONS } from './constants';

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
      limitExceeded: 'Save Data Limit Exceeds',
      deckNotSavedWarning: 'Your deck might not be fully saved',
      statusOk: 'OK',
      tierPrefix: 'Tier',
      faintMemory: 'Faint Memory:',
      pointsSuffix: 'Points',
      saveDataLimit: 'Save Data Limit:',
      totalPrefix: 'Total:',
      saveDataTier: 'Save Data Tier:',
      pointOverflow: (points: number) => `${points} point overflow`,
      tooltips: {
        neutralCard: (points: number) => <>{`${points} points per card.`}<br/><br/>A general card that can be found in the shop or from events. Check the in-game card gallery if you're not sure.</>,
        monsterCard: (points: number) => <>{`${points} points per card.`}<br/><br/>Card obtained by defeating an <strong>Elite Boss</strong>.</>,
        cardConversion: (points: number) => <>{`${points} points per card.`}<br/><br/>Any of your combatant cards can be converted into a <strong>Neutral Card</strong> in a specific rare event. If you convert to a card that has a <strong>[Remove]</strong> tag, the conversion cost is ignored, so do not input a value here.</>,
        normalEpiphany: (points: number) => <>
            {`${points} points per card.`}<br/><br/>
            A <strong>Neutral Card</strong> or <strong>Monster Card</strong> that has an <strong>Epiphany</strong> upgrade.<br/><br/>
            <strong>Note:</strong> <strong>Regular Epiphany</strong> and <strong>Divine Epiphany</strong> on <strong>Neutral/Monster Cards</strong> are counted separately.<br/>
            If a <strong>Neutral Card</strong> has a <strong>Divine Epiphany</strong>, you must add +1 here and +1 in the <strong>Divine Epiphany</strong> section.<br/><br/>
            For some reason, a <strong>Monster Card</strong> with a <strong>Regular Epiphany</strong> does not give any additional points. Only <strong>Divine Epiphany</strong> gives +20 points, so keep that in mind.
        </>,
        divineEpiphany: (points: number) => <>{`${points} points per card.`}<br/><br/>Any <strong>Divine Epiphany</strong> upgrade on <strong>All Cards</strong> in your deck.</>,
        forbiddenCard: (points: number) => <>{`${points} points per card.`}<br/><br/>A card obtained from a <strong>chaos event</strong>. These cards will always be saved, based on the in-game description.</>,
        characterCard: (points: number) => <>{`${points} points per card.`}<br/><br/>When you remove a card, if that card is one of your own <strong>Character/Combatant Cards</strong>, add +1 to this section.</>,
        cardRemoved: <>{`Points scale: 1=0, 2=10, 3=40...`}<br/><br/>Any card you removed, including <strong>Neutral</strong>, <strong>Monster</strong>, <strong>Forbidden</strong>, or your own <strong>Character Card</strong>.</>,
        cardDuplication: <>{`Points scale: 1=0, 2=10, 3=40...`}<br/><br/>Any card you duplicate or have <strong>[Replicate]</strong> tag on it.</>,
      },
    },
    settings: {
      title: 'Edit Point Rules',
      close: 'Close settings',
      cardPointsHeader: 'Card Points',
      scalingHeader: 'CARD REMOVAL/DUPLICATE SCALING',
      scalingDesc1: "This defines how points are calculated for 'Card Removed' and 'Card Duplication'. The first card of each type is always 0 points.",
      scalingInitial: 'Initial Increment:',
      scalingInitialDesc: 'Sets the points awarded for the second card.',
      scalingStep: 'Increment Step:',
      scalingStepDesc: 'The amount the point reward increases for each card after the second one.',
      example: 'Example with default values (10 / 20):',
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
      limitExceeded: 'Batas Save Data Terlampaui',
      deckNotSavedWarning: 'Deck mungkin tidak tersimpan sepenuhnya',
      statusOk: 'OK',
      tierPrefix: 'Tier',
      faintMemory: 'Faint Memory:',
      pointsSuffix: 'Poin',
      saveDataLimit: 'Batas Save Data:',
      totalPrefix: 'Total:',
      saveDataTier: 'Save Data Tier:',
      pointOverflow: (points: number) => `${points} poin berlebih`,
      tooltips: {
        neutralCard: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Kartu umum yang bisa ditemukan di toko atau dari event. Periksa galeri kartu di dalam game jika tidak yakin.</>,
        monsterCard: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Kartu yang didapat dengan mengalahkan <strong>Elite Boss</strong>.</>,
        cardConversion: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Setiap kartu combatant dapat diubah menjadi <strong>Neutral Card</strong> di event langka tertentu. Jika diubah menjadi kartu yang memiliki tag <strong>[Remove]</strong>, biaya konversi diabaikan, jadi jangan masukkan nilai di sini.</>,
        normalEpiphany: (points: number) => <>
            {`${points} poin per kartu.`}<br/><br/>
            Sebuah <strong>Neutral Card</strong> atau <strong>Monster Card</strong> yang memiliki upgrade <strong>Epiphany</strong>.<br/><br/>
            <strong>Catatan:</strong> <strong>Regular Epiphany</strong> dan <strong>Divine Epiphany</strong> pada <strong>Neutral/Monster Cards</strong> dihitung secara terpisah.<br/>
            Jika sebuah <strong>Neutral Card</strong> memiliki <strong>Divine Epiphany</strong>, Anda harus menambahkan +1 di sini dan +1 di bagian <strong>Divine Epiphany</strong>.<br/><br/>
            Karena alasan tertentu, sebuah <strong>Monster Card</strong> dengan <strong>Regular Epiphany</strong> tidak memberikan poin tambahan apa pun. Hanya <strong>Divine Epiphany</strong> yang memberikan +20 poin, jadi harap diingat.
        </>,
        divineEpiphany: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Setiap upgrade <strong>Divine Epiphany</strong> pada <strong>Semua Kartu</strong> di dalam deck.</>,
        forbiddenCard: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Kartu yang didapat dari <strong>chaos event</strong>. Kartu-kartu ini akan selalu tersimpan, berdasarkan deskripsi di dalam game.</>,
        characterCard: (points: number) => <>{`${points} poin per kartu.`}<br/><br/>Saat menghapus kartu, jika kartu tersebut adalah salah satu dari <strong>Character/Combatant Cards</strong> milik sendiri, tambahkan +1 ke bagian ini.</>,
        cardRemoved: <>{`Skala poin: 1=0, 2=10, 3=40...`}<br/><br/>Setiap kartu yang dihapus akan dihitung, termasuk <strong>Neutral</strong>, <strong>Monster</strong>, <strong>Forbidden</strong>, atau <strong>Character Card</strong> milik sendiri.</>,
        cardDuplication: <>{`Skala poin: 1=0, 2=10, 3=40...`}<br/><br/>Setiap kartu yang diduplikasi atau kartu yang ada tag <strong>[Replicate]</strong>.</>,
      },
    },
    settings: {
      title: 'Edit Aturan Poin',
      close: 'Tutup pengaturan',
      cardPointsHeader: 'Poin Kartu',
      scalingHeader: 'SKALA PENGHAPUSAN/DUPLIKASI KARTU',
      scalingDesc1: "Ini menentukan bagaimana poin dihitung untuk 'Kartu Dihapus' dan 'Duplikasi Kartu'. Kartu pertama dari setiap jenis selalu 0 poin.",
      scalingInitial: 'Kenaikan Awal:',
      scalingInitialDesc: 'Menetapkan poin yang diberikan untuk kartu kedua.',
      scalingStep: 'Langkah Kenaikan:',
      scalingStepDesc: 'Jumlah kenaikan hadiah poin untuk setiap kartu setelah kartu kedua.',
      example: 'Contoh dengan nilai default (10 / 20):',
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
}

const NumberInput: React.FC<NumberInputProps> = ({ id, label, value, onValueChange, tooltipText, ariaLabel, isOverLimit }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onValueChange(numValue);
    } else if (e.target.value === '') {
      onValueChange(0);
    }
  };

  const adjustValue = (amount: number) => {
    onValueChange(Math.max(0, value + amount));
  };
  
  const finalAriaLabel = ariaLabel || (typeof label === 'string' ? label : id);

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
      <div className={`flex items-center flex-shrink-0 bg-[var(--input-bg)] rounded-lg border transition-colors duration-300 focus-within:ring-1 ${
          isOverLimit && value > 0
            ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20'
            : `focus-within:border-blue-500 focus-within:border-blue-500 focus-within:ring-blue-500/20 ${value > 0 ? 'border-blue-500' : 'border-white/5'}`
        }`}>
        <button onClick={() => adjustValue(-1)} className="h-10 w-9 flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/5 rounded-l-lg transition-colors" aria-label={`Decrease ${finalAriaLabel}`}>
          <ChevronDown />
        </button>
        <input
          id={id}
          type="number"
          value={value}
          onChange={handleInputChange}
          min="0"
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
    const combatantCardPoints = useMemo(() => {
        return (
            values.neutralCard * rules.NEUTRAL_CARD +
            values.monsterCard * rules.MONSTER_CARD +
            values.cardConversion * rules.CARD_CONVERSION +
            values.normalEpiphany * rules.NORMAL_EPIPHANY +
            values.divineEpiphany * rules.DIVINE_EPIPHANY +
            values.forbiddenCard * rules.FORBIDDEN_CARD
        );
    }, [values.neutralCard, values.monsterCard, values.cardConversion, values.normalEpiphany, values.divineEpiphany, values.forbiddenCard, rules]);

    const removalDuplicationPoints = useMemo(() => {
        return (
            values.characterCard * rules.CHARACTER_CARD +
            calculateSpecialPoints(values.cardRemoved, rules.SPECIAL_ACTION_INITIAL_INCREMENT, rules.SPECIAL_ACTION_INCREMENT_STEP) +
            calculateSpecialPoints(values.cardDuplication, rules.SPECIAL_ACTION_INITIAL_INCREMENT, rules.SPECIAL_ACTION_INCREMENT_STEP)
        );
    }, [values.characterCard, values.cardRemoved, values.cardDuplication, rules]);

    const totalPoints = useMemo(() => {
        return combatantCardPoints + removalDuplicationPoints;
    }, [combatantCardPoints, removalDuplicationPoints]);

    const tierLimit = useMemo(() => {
        return calculateTierLimit(values.mapTier);
    }, [values.mapTier]);

    const isWithinLimit = totalPoints <= tierLimit;
    
    const progress = tierLimit > 0 ? Math.min((totalPoints / tierLimit) * 100, 100) : 0;
    
    const handleTierChange = (increment: number) => {
        const newTier = values.mapTier + increment;
        if (newTier >= TIER_OPTIONS[0] && newTier <= TIER_OPTIONS[TIER_OPTIONS.length - 1]) {
            onValueChange('mapTier', newTier);
        }
    };

    return (
        <div className="card-container w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4 transition-all duration-300 md:hover:scale-[1.02] md:hover:shadow-[0_0_30px_rgba(0,120,212,0.2)] fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                    type="text"
                    value={values.characterName}
                    onChange={(e) => onValueChange('characterName', e.target.value)}
                    className="w-full sm:flex-grow bg-transparent text-white rounded-lg p-3 border-b-2 border-slate-700 focus:outline-none focus:border-[var(--accent-color)] transition duration-300 text-lg font-semibold placeholder-slate-500"
                    placeholder={t.calculator.placeholder}
                />
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
                    <NumberInput isOverLimit={!isWithinLimit} id={`neutral-card-${instanceIndex}`} label="Neutral Card" value={values.neutralCard} onValueChange={(v) => onValueChange('neutralCard', v)} tooltipText={t.calculator.tooltips.neutralCard(rules.NEUTRAL_CARD)} />
                    <NumberInput isOverLimit={!isWithinLimit} id={`monster-card-${instanceIndex}`} label="Monster Card" value={values.monsterCard} onValueChange={(v) => onValueChange('monsterCard', v)} tooltipText={t.calculator.tooltips.monsterCard(rules.MONSTER_CARD)} />
                    <NumberInput isOverLimit={!isWithinLimit} id={`card-conversion-${instanceIndex}`} label="Card Conversion" value={values.cardConversion} onValueChange={(v) => onValueChange('cardConversion', v)} tooltipText={t.calculator.tooltips.cardConversion(rules.CARD_CONVERSION)} />
                    <NumberInput 
                        isOverLimit={!isWithinLimit}
                        id={`normal-epiphany-${instanceIndex}`} 
                        label={<>N/M Card<br/>Epiphany</>}
                        ariaLabel="Neutral Monster Epiphany"
                        value={values.normalEpiphany} 
                        onValueChange={(v) => onValueChange('normalEpiphany', v)} 
                        tooltipText={t.calculator.tooltips.normalEpiphany(rules.NORMAL_EPIPHANY)} 
                    />
                    <NumberInput isOverLimit={!isWithinLimit} id={`divine-epiphany-${instanceIndex}`} label="Divine Epiphany" value={values.divineEpiphany} onValueChange={(v) => onValueChange('divineEpiphany', v)} tooltipText={t.calculator.tooltips.divineEpiphany(rules.DIVINE_EPIPHANY)} />
                    <NumberInput isOverLimit={!isWithinLimit} id={`forbidden-card-${instanceIndex}`} label="Forbidden Card" value={values.forbiddenCard} onValueChange={(v) => onValueChange('forbiddenCard', v)} tooltipText={t.calculator.tooltips.forbiddenCard(rules.FORBIDDEN_CARD)} />
                </div>
                
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <NumberInput isOverLimit={!isWithinLimit} id={`character-card-${instanceIndex}`} label="Character Card" value={values.characterCard} onValueChange={(v) => onValueChange('characterCard', v)} tooltipText={t.calculator.tooltips.characterCard(rules.CHARACTER_CARD)} />
                    <NumberInput isOverLimit={!isWithinLimit} id={`card-removed-${instanceIndex}`} label="Card Removed" value={values.cardRemoved} onValueChange={(v) => onValueChange('cardRemoved', v)} tooltipText={t.calculator.tooltips.cardRemoved} />
                    <NumberInput isOverLimit={!isWithinLimit} id={`card-duplication-${instanceIndex}`} label="Card Duplication" value={values.cardDuplication} onValueChange={(v) => onValueChange('cardDuplication', v)} tooltipText={t.calculator.tooltips.cardDuplication} />
                </div>
            </div>
            
            <div className="mt-2 pt-4 border-t border-slate-700/50 flex flex-col gap-2">
                <div className="w-full bg-slate-900/50 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${isWithinLimit ? 'bg-green-500' : 'bg-red-500'}`} 
                      style={{ width: `${progress}%` }}>
                    </div>
                </div>
                <div className="flex justify-between text-slate-300 text-sm">
                    <span>
                        {t.calculator.faintMemory} <span className={`font-bold transition-colors duration-300 ${isWithinLimit ? 'text-green-300' : 'text-red-300'}`}>
                            {totalPoints} {t.calculator.pointsSuffix}
                        </span>
                    </span>
                    <span>{t.calculator.saveDataLimit} <span className="font-bold text-white">{tierLimit}</span></span>
                </div>
                <div className={`text-center font-bold text-lg p-2.5 rounded-lg transition-colors duration-300 ${isWithinLimit ? 'text-green-300 bg-green-500/10' : 'text-red-300 bg-red-500/10'}`}>
                    <div className="h-7 overflow-hidden" aria-live="polite"> {/* text-lg has line-height: 1.75rem = 28px = h-7 */}
                        <div 
                            className={`transition-transform duration-500 ease-in-out ${isWithinLimit ? 'translate-y-0' : '-translate-y-1/2'}`}
                            style={{ height: '200%' }}
                        >
                            <div className="h-1/2 flex items-center justify-center">
                                <span>{t.calculator.statusOk}</span>
                            </div>
                            <div className="h-1/2 flex items-center justify-center">
                                <span>{t.calculator.limitExceeded}</span>
                            </div>
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
    
    const normalRules = Object.entries(rules).filter(([key]) => !key.startsWith('SPECIAL_ACTION'));
    const specialRules = Object.entries(rules).filter(([key]) => key.startsWith('SPECIAL_ACTION'));

    const ruleLabels: { [key: string]: string } = {
        'NEUTRAL_CARD': 'Neutral Card',
        'MONSTER_CARD': 'Monster Card',
        'CARD_CONVERSION': 'Card Conversion',
        'NORMAL_EPIPHANY': 'Neutral/Monster Epiphany',
        'DIVINE_EPIPHANY': 'Divine Epiphany',
        'FORBIDDEN_CARD': 'Forbidden Card',
        'CHARACTER_CARD': 'Character Card',
        'SPECIAL_ACTION_INITIAL_INCREMENT': 'Initial Increment',
        'SPECIAL_ACTION_INCREMENT_STEP': 'Increment Step',
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
            <div className="card-container w-full max-w-md rounded-2xl p-4 sm:p-6 flex flex-col gap-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
                <div className="flex justify-between items-center">
                    <h2 id="settings-title" className="text-xl font-bold text-white">{t.settings.title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 text-2xl leading-none rounded-full hover:bg-white/10 transition-colors" aria-label={t.settings.close}>&times;</button>
                </div>
                <div className="flex flex-col gap-2 max-h-[75vh] sm:max-h-[60vh] overflow-y-auto pr-2">
                    <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider">{t.settings.cardPointsHeader}</h3>
                    {normalRules.map(([key, value]) => (
                        <RuleInput
                            key={key}
                            label={ruleLabels[key] || key.replace(/_/g, ' ')}
                            value={value as number}
                            onChange={(e) => handleRuleChange(key as keyof Rules, e.target.value)}
                        />
                    ))}
                    <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mt-4">{t.settings.scalingHeader}</h3>
                    <div className="text-xs text-slate-500 mb-2 space-y-2">
                        <p>{t.settings.scalingDesc1}</p>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li><span className="font-semibold text-slate-400">{t.settings.scalingInitial}</span> {t.settings.scalingInitialDesc}</li>
                            <li><span className="font-semibold text-slate-400">{t.settings.scalingStep}</span> {t.settings.scalingStepDesc}</li>
                        </ul>
                        <div>
                            <p className="font-semibold text-slate-400">{t.settings.example}</p>
                            <div className="pl-4 mt-1 text-slate-500/90 leading-relaxed">
                                1st card: <span className="font-mono">0</span> pts<br/>
                                2nd card: <span className="font-mono">10</span> pts<br/>
                                3rd card: <span className="font-mono">40</span> pts (adds 30)<br/>
                                4th card: <span className="font-mono">90</span> pts (adds 50)
                            </div>
                        </div>
                    </div>
                    {specialRules.map(([key, value]) => (
                         <RuleInput
                            key={key}
                            label={ruleLabels[key] || key}
                            value={value as number}
                            onChange={(e) => handleRuleChange(key as keyof Rules, e.target.value)}
                        />
                    ))}
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
        mapTier: 1, neutralCard: 0, monsterCard: 0, cardConversion: 0, normalEpiphany: 0, divineEpiphany: 0,
        forbiddenCard: 0, cardRemoved: 0, characterCard: 0, cardDuplication: 0,
    };
    const defaultState: CalculatorState[] = [
        { ...initialCalculatorState, characterName: 'Combatant 1' },
    ];
    
    const STORAGE_KEYS = {
        CALCULATORS: 'czn_tracker_calculators',
        RULES: 'czn_tracker_rules',
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
            calc.monsterCard !== initialCalculatorState.monsterCard ||
            calc.cardConversion !== initialCalculatorState.cardConversion ||
            calc.normalEpiphany !== initialCalculatorState.normalEpiphany ||
            calc.divineEpiphany !== initialCalculatorState.divineEpiphany ||
            calc.forbiddenCard !== initialCalculatorState.forbiddenCard ||
            calc.cardRemoved !== initialCalculatorState.cardRemoved ||
            calc.characterCard !== initialCalculatorState.characterCard ||
            calc.cardDuplication !== initialCalculatorState.cardDuplication
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
                    <h1 className="relative z-10 text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-50 to-blue-300 drop-shadow-[0_0_25px_rgba(59,130,246,0.3)] mb-0 pb-2 sm:pb-4">
                        Chaos Zero Nightmare
                    </h1>
                    
                    {/* Subtitle with tracking */}
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400/90 tracking-[0.2em] uppercase mb-2 drop-shadow-md">
                        Save Data Tracker
                    </h2>

                     {/* Description */}
                    <div className="relative z-10 max-w-2xl mx-auto">
                         <div className="h-1 w-20 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto mb-3 opacity-50 rounded-full"></div>
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
                    href="https://docs.google.com/spreadsheets/d/1diExmbtbyTGMmB_-RfQvn0in-DM-gPjQu14XjviIJ0Y/edit?gid=1278070975#gid=1278070975"
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
