
import React, { useState, useMemo, useEffect } from 'react';
import type { CalculatorState } from './types';
import { DEFAULT_POINTS, calculateSpecialPoints, calculateTierLimit, TIER_OPTIONS } from './constants';

type Rules = typeof DEFAULT_POINTS;

// Helper component for tooltips
interface TooltipProps {
  text: React.ReactNode;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-black/80 rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 invisible group-hover:visible group-focus-within:visible z-10 pointer-events-none">
        {text}
      </div>
    </div>
  );
};


// Helper component for number inputs with steppers
interface NumberInputProps {
  id: string; // Unique id for the input
  label: React.ReactNode; // Label can now be a React node (e.g., for multi-line)
  value: number;
  onValueChange: (newValue: number) => void;
  tooltipText?: React.ReactNode;
  ariaLabel?: string; // Explicit aria-label for screen readers if label is complex
}

const NumberInput: React.FC<NumberInputProps> = ({ id, label, value, onValueChange, tooltipText, ariaLabel }) => {
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
  
  const ChevronUp = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
      <path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
    </svg>
  );
  
  const ChevronDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
      <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
    </svg>
  );

  const finalAriaLabel = ariaLabel || (typeof label === 'string' ? label : id);

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 h-12">
       <div className="flex items-center gap-1.5">
            <label htmlFor={id} className="text-slate-300 text-sm leading-tight text-left">
              {label}
            </label>
            {tooltipText && (
              <Tooltip text={tooltipText}>
                <button type="button" className="text-slate-500 hover:text-white transition-colors duration-200 cursor-help rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg-color)] focus:ring-[var(--accent-color)]" aria-label={`Help for ${finalAriaLabel}`}>
                  <QuestionIcon />
                </button>
              </Tooltip>
            )}
        </div>
      <div className={`flex items-center flex-shrink-0 bg-[var(--input-bg)] rounded-lg border ${value > 0 ? 'border-[var(--accent-color)]' : 'border-transparent'} focus-within:border-[var(--accent-color)] focus-within:ring-1 focus-within:ring-[var(--accent-color)]/50 transition-all duration-300`}>
        <button onClick={() => adjustValue(-1)} className="h-10 w-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-l-lg transition-colors" aria-label={`Decrease ${finalAriaLabel}`}>
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
        <button onClick={() => adjustValue(1)} className="h-10 w-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-r-lg transition-colors" aria-label={`Increase ${finalAriaLabel}`}>
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
}

const ResetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
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


const CalculatorInstance: React.FC<CalculatorInstanceProps> = ({ instanceIndex, values, onValueChange, onReset, rules, isLast, onAdd, onRemove, canAdd, canRemove }) => {
    const totalPoints = useMemo(() => {
        let total = 0;
        total += values.neutralCard * rules.NEUTRAL_CARD;
        total += values.monsterCard * rules.MONSTER_CARD;
        total += values.cardConversion * rules.CARD_CONVERSION;
        total += values.normalEpiphany * rules.NORMAL_EPIPHANY;
        total += values.divineEpiphany * rules.DIVINE_EPIPHANY;
        total += values.forbiddenCard * rules.FORBIDDEN_CARD;
        total += values.characterCard * rules.CHARACTER_CARD;
        total += calculateSpecialPoints(values.cardRemoved, rules.SPECIAL_ACTION_INITIAL_INCREMENT, rules.SPECIAL_ACTION_INCREMENT_STEP);
        total += calculateSpecialPoints(values.cardDuplication, rules.SPECIAL_ACTION_INITIAL_INCREMENT, rules.SPECIAL_ACTION_INCREMENT_STEP);
        return total;
    }, [values, rules]);

    const tierLimit = useMemo(() => {
        return calculateTierLimit(values.mapTier);
    }, [values.mapTier]);

    const isWithinLimit = totalPoints <= tierLimit;
    
    const progress = tierLimit > 0 ? Math.min((totalPoints / tierLimit) * 100, 100) : 0;

    return (
        <div className="card-container w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4 transition-all duration-300 md:hover:scale-[1.02] md:hover:shadow-[0_0_30px_rgba(0,120,212,0.2)] fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                    type="text"
                    value={values.characterName}
                    onChange={(e) => onValueChange('characterName', e.target.value)}
                    className="w-full sm:flex-grow bg-transparent text-white rounded-lg p-3 border-b-2 border-slate-700 focus:outline-none focus:border-[var(--accent-color)] transition duration-300 text-lg font-semibold placeholder-slate-500"
                    placeholder="Combatant Name"
                />
                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <Tooltip text="Reset Fields">
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
                            <Tooltip text="Remove Combatant">
                                <button
                                    onClick={onRemove}
                                    disabled={!canRemove}
                                    className="p-3 flex-shrink-0 rounded-lg text-slate-400 bg-[var(--input-bg)] hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Remove last combatant"
                                >
                                    <MinusIcon />
                                </button>
                            </Tooltip>
                            <Tooltip text="Add Combatant">
                                <button
                                    onClick={onAdd}
                                    disabled={!canAdd}
                                    className="p-3 flex-shrink-0 rounded-lg text-slate-400 bg-[var(--input-bg)] hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <label htmlFor={`map-tier-${values.characterName}`} className="text-slate-300 text-sm font-medium whitespace-nowrap">Save Data Tier:</label>
                <div className="relative flex-grow">
                    <select
                        id={`map-tier-${values.characterName}`}
                        value={values.mapTier}
                        onChange={(e) => onValueChange('mapTier', parseInt(e.target.value, 10))}
                        className="w-full bg-[var(--input-bg)] text-white rounded-lg border border-slate-700 p-2 focus:outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/50 transition appearance-none text-center pr-8"
                    >
                        {TIER_OPTIONS.map((tier) => (
                            <option key={tier} value={tier} className="bg-slate-900 text-white">Tier {tier}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <div>
                        <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider">COMBATAN CARD</h3>
                        <div className="mt-1.5 h-[2px] w-full bg-[var(--accent-color)] rounded"></div>
                    </div>
                    <NumberInput id={`neutral-card-${instanceIndex}`} label="Neutral Card" value={values.neutralCard} onValueChange={(v) => onValueChange('neutralCard', v)} tooltipText={<>{`${rules.NEUTRAL_CARD} points per card.`}<br/><br/>A general card that can be found in the shop or from events. Check the in-game card gallery if you're not sure.</>} />
                    <NumberInput id={`monster-card-${instanceIndex}`} label="Monster Card" value={values.monsterCard} onValueChange={(v) => onValueChange('monsterCard', v)} tooltipText={<>{`${rules.MONSTER_CARD} points per card.`}<br/><br/>Card obtained by defeating an <strong>Elite Boss</strong>.</>} />
                    <NumberInput id={`card-conversion-${instanceIndex}`} label="Card Conversion" value={values.cardConversion} onValueChange={(v) => onValueChange('cardConversion', v)} tooltipText={<>{`${rules.CARD_CONVERSION} points per card.`}<br/><br/>Any of your combatant cards can be converted into a <strong>Neutral Card</strong> in a specific rare event. If you convert to a card that has a <strong>[Remove]</strong> tag, the conversion cost is ignored, so do not input a value here.</>} />
                    <NumberInput 
                        id={`normal-epiphany-${instanceIndex}`} 
                        label={<>Neutral/Monster<br/>Epiphany</>}
                        ariaLabel="Neutral Monster Epiphany"
                        value={values.normalEpiphany} 
                        onValueChange={(v) => onValueChange('normalEpiphany', v)} 
                        tooltipText={<>
                            {`${rules.NORMAL_EPIPHANY} points per card.`}<br/><br/>
                            A <strong>Neutral Card</strong> or <strong>Monster Card</strong> that has an <strong>Epiphany</strong> upgrade.<br/><br/>
                            <strong>Note:</strong> <strong>Normal Epiphany</strong> and <strong>Divine Epiphany</strong> on Neutral/Monster Card are counted separately. If a Neutral/Monster Card has a Divine Epiphany, you must add +1 here AND +1 in the Divine Epiphany section.
                        </>} 
                    />
                    <NumberInput id={`divine-epiphany-${instanceIndex}`} label="Divine Epiphany" value={values.divineEpiphany} onValueChange={(v) => onValueChange('divineEpiphany', v)} tooltipText={<>{`${rules.DIVINE_EPIPHANY} points per card.`}<br/><br/>Any <strong>Divine Epiphany</strong> upgrade on <strong>All Cards</strong> in your deck is counted here.</>} />
                    <NumberInput id={`forbidden-card-${instanceIndex}`} label="Forbidden Card" value={values.forbiddenCard} onValueChange={(v) => onValueChange('forbiddenCard', v)} tooltipText={<>{`${rules.FORBIDDEN_CARD} points per card.`}<br/><br/>A card obtained from a <strong>chaos event</strong>. These cards will always be saved, based on the in-game description.</>} />
                </div>
                
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <div>
                        <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider">CARD REMOVAL/DUPLICATED</h3>
                        <div className="mt-1.5 h-[2px] w-full bg-[var(--accent-color)] rounded"></div>
                    </div>
                    <NumberInput id={`character-card-${instanceIndex}`} label="Character Card" value={values.characterCard} onValueChange={(v) => onValueChange('characterCard', v)} tooltipText={<>{`${rules.CHARACTER_CARD} points per card.`}<br/><br/>When you remove a card, if that card is one of your own <strong>Character/Combatant Cards</strong>, add +1 to this section.</>} />
                    <NumberInput id={`card-removed-${instanceIndex}`} label="Card Removed" value={values.cardRemoved} onValueChange={(v) => onValueChange('cardRemoved', v)} tooltipText={<>{`Points scale: 1=0, 2=10, 3=40...`}<br/><br/>Any card you remove is counted, including <strong>Neutral</strong>, <strong>Monster</strong>, <strong>Forbidden</strong>, or your own <strong>Character Card</strong>.</>} />
                    <NumberInput id={`card-duplication-${instanceIndex}`} label="Card Duplication" value={values.cardDuplication} onValueChange={(v) => onValueChange('cardDuplication', v)} tooltipText={<>{`Same scaling as Card Removed: 1=0, 2=10, 3=40...`}<br/><br/>Any card you duplicate is counted here.</>} />
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
                    <span>Faint Memory: <span className="font-bold text-white">{totalPoints} Points</span></span>
                    <span>Limit: <span className="font-bold text-white">{tierLimit}</span></span>
                </div>
                <div className={`text-center font-bold text-lg p-2.5 rounded-lg transition-all duration-300 ${isWithinLimit ? 'text-green-300 bg-green-500/10' : 'text-red-300 bg-red-500/10'}`}>
                    {isWithinLimit ? 'OK' : 'Save Data Limit Exceeds'}
                </div>
                {!isWithinLimit && (
                    <div className="flex flex-col items-center justify-center gap-1 mt-1 fade-in">
                         <div className="flex items-center gap-2 text-yellow-300 text-xs">
                            <WarningIcon />
                            <span>You are {totalPoints - tierLimit} points over the limit.</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-300 text-xs">
                            <WarningIcon />
                            <span>Your deck might not be fully saved</span>
                        </div>
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

const SettingsModal: React.FC<SettingsModalProps> = ({ rules, setRules, onClose }) => {
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
                    <h2 id="settings-title" className="text-xl font-bold text-white">Edit Point Rules</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 text-2xl leading-none" aria-label="Close settings">&times;</button>
                </div>
                <div className="flex flex-col gap-2 max-h-[75vh] sm:max-h-[60vh] overflow-y-auto pr-2">
                    <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Card Points</h3>
                    {normalRules.map(([key, value]) => (
                        <RuleInput
                            key={key}
                            label={ruleLabels[key] || key.replace(/_/g, ' ')}
                            value={value as number}
                            onChange={(e) => handleRuleChange(key as keyof Rules, e.target.value)}
                        />
                    ))}
                    <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mt-4">CARD REMOVAL/DUPLICATE SCALING</h3>
                    <div className="text-xs text-slate-500 mb-2 space-y-2">
                        <p>This defines how points are calculated for 'Card Removed' and 'Card Duplication'. The first card of each type is always 0 points.</p>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li><span className="font-semibold text-slate-400">Initial Increment:</span> Sets the points awarded for the <em>second</em> card.</li>
                            <li><span className="font-semibold text-slate-400">Increment Step:</span> The amount the point reward increases for each card <em>after</em> the second one.</li>
                        </ul>
                        <div>
                            <p className="font-semibold text-slate-400">Example with default values (10 / 20):</p>
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
                    <button onClick={handleResetToDefault} className="flex-1 p-3 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-colors duration-200 font-semibold">Reset to Default</button>
                    <button onClick={onClose} className="flex-1 p-3 rounded-lg bg-[var(--accent-color)] text-white hover:bg-blue-500 transition-colors duration-200 font-semibold">Done</button>
                </div>
            </div>
        </div>
    );
};

// Confirmation Modal Component
interface ConfirmationModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
            <div className="card-container w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 text-center" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
                <h2 id="confirm-title" className="text-xl font-bold text-white">Remove Combatant?</h2>
                <p className="text-slate-300 text-sm">
                    This combatant has modified data. Are you sure you want to remove it? This action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button onClick={onCancel} className="flex-1 p-3 rounded-lg bg-slate-500/20 text-slate-300 hover:bg-slate-500/40 transition-colors duration-200 font-semibold">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 p-3 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors duration-200 font-semibold">Remove</button>
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
}

const UpdateLogModal: React.FC<UpdateLogModalProps> = ({ onClose, logContent, isLoading, error, onRefresh }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
            <div className="card-container w-full max-w-lg rounded-2xl p-4 sm:p-6 flex flex-col gap-4" role="dialog" aria-modal="true" aria-labelledby="update-log-title">
                <div className="flex justify-between items-center">
                    <h2 id="update-log-title" className="text-xl font-bold text-white">Update Log</h2>
                    <div className="flex items-center gap-1">
                        <Tooltip text="Refresh Log">
                            <button onClick={onRefresh} className={`text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-transform duration-500 ${isLoading ? 'animate-spin' : 'hover:scale-110'}`} aria-label="Refresh update log" disabled={isLoading}>
                                <ResetIcon />
                            </button>
                        </Tooltip>
                        <button onClick={onClose} className="text-slate-400 hover:text-white p-2 text-2xl leading-none" aria-label="Close update log">&times;</button>
                    </div>
                </div>
                <div className="bg-[var(--input-bg)] rounded-lg p-4 max-h-[75vh] sm:max-h-[60vh] overflow-y-auto pr-2 border border-slate-700/50 min-h-[12rem] flex flex-col">
                    {isLoading ? (
                        <div className="flex-grow flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
                        </div>
                    ) : error ? (
                         <div className="flex-grow flex flex-col justify-center items-center text-center p-4">
                            <p className="text-red-400 font-semibold">Failed to Load Updates</p>
                            <p className="text-slate-400 text-xs mt-1">{error}</p>
                            <button onClick={onRefresh} className="mt-4 text-sm bg-red-500/20 text-red-300 hover:bg-red-500/40 px-4 py-2 rounded-lg transition-colors font-semibold">
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{logContent}</pre>
                    )}
                </div>
                <div className="flex justify-end gap-4 mt-2">
                    <button onClick={onClose} className="w-full sm:w-auto p-3 px-8 rounded-lg bg-[var(--accent-color)] text-white hover:bg-blue-500 transition-colors duration-200 font-semibold">Done</button>
                </div>
            </div>
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
    const [calculators, setCalculators] = useState<CalculatorState[]>(defaultState);
    const [rules, setRules] = useState<Rules>(DEFAULT_POINTS);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [isUpdateLogOpen, setIsUpdateLogOpen] = useState(false);

    const [logContent, setLogContent] = useState<string>('');
    const [isLogLoading, setIsLogLoading] = useState(false);
    const [logError, setLogError] = useState<string | null>(null);

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
            <header className="relative w-full p-6 sm:p-8 text-center border-b border-[var(--border-color)]">
                 <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide" style={{ textShadow: '0 0 10px rgba(0, 120, 212, 0.5), 0 0 20px rgba(0, 120, 212, 0.3)' }}>
                    Chaos Zero Nightmare Save Data Tracker
                </h1>
                <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
                    A tool to calculate and track your Faint Memory points to control which card you want to keep in your deck. Enter your card counts for the Combatant to see if you are hitting the save data limit or not. Tools based on this <a href="https://www.reddit.com/r/ChaosZeroNightmare/comments/1ovg538/i_create_the_deck_builder_app_in_case_you_guys" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] hover:underline">reddit</a> post.
                </p>
            </header>

            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 py-6 px-4">
                <a
                    href="https://raw.githubusercontent.com/DEX-1101/CZN-Save-Data-Tracker/refs/heads/main/exx.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[var(--card-bg-color)] border border-[var(--border-color)] text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-300 font-semibold backdrop-filter backdrop-blur-lg"
                    aria-label="How To Use Guide"
                >
                    <QuestionIcon />
                    <span>How To Use</span>
                </a>
                <a
                    href="https://docs.google.com/spreadsheets/d/1diExmbtbyTGMmB_-RfQvn0in-DM-gPjQu14XjviIJ0Y/edit?gid=1278070975#gid=1278070975"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[var(--card-bg-color)] border border-[var(--border-color)] text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-300 font-semibold backdrop-filter backdrop-blur-lg"
                    aria-label="Read the RULES here"
                >
                    <RulesIcon />
                    <span>Read the RULES here</span>
                </a>
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
                    />
                ))}
            </main>

            <footer className="w-full p-6 flex justify-center">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-[var(--card-bg-color)] border border-[var(--border-color)] text-white px-6 py-3 rounded-full shadow-2xl hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-300 font-semibold backdrop-filter backdrop-blur-lg"
                        aria-label="Edit Point Rules"
                    >
                        Edit Point Rule
                    </button>
                    <button
                        onClick={handleOpenUpdateLog}
                        className="bg-[var(--card-bg-color)] border border-[var(--border-color)] text-white px-6 py-3 rounded-full shadow-2xl hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-300 font-semibold backdrop-filter backdrop-blur-lg"
                        aria-label="View Update Log"
                    >
                        Update Log
                    </button>
                     <Tooltip text="Feel free to create an issue if something wrong/missing">
                        <a
                            href="https://github.com/DEX-1101/CZN-Save-Data-Tracker"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[var(--card-bg-color)] border border-[var(--border-color)] text-white p-3 rounded-full shadow-2xl hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-300 backdrop-filter backdrop-blur-lg flex items-center justify-center"
                            aria-label="View source code on GitHub"
                        >
                            <GithubIcon />
                        </a>
                    </Tooltip>
                </div>
            </footer>

            {isSettingsOpen && (
                <SettingsModal rules={rules} setRules={setRules} onClose={() => setIsSettingsOpen(false)} />
            )}
            
            {showRemoveConfirm && (
                <ConfirmationModal
                    onConfirm={() => {
                        removeCalculator();
                        setShowRemoveConfirm(false);
                    }}
                    onCancel={() => setShowRemoveConfirm(false)}
                />
            )}

            {isUpdateLogOpen && (
                <UpdateLogModal 
                    onClose={() => setIsUpdateLogOpen(false)} 
                    logContent={logContent}
                    isLoading={isLogLoading}
                    error={logError}
                    onRefresh={fetchLog}
                />
            )}
        </div>
    );
};

export default App;
