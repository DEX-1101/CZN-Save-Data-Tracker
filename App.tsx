
import React, { useState, useMemo } from 'react';
import type { CalculatorState } from './types';
import { DEFAULT_POINTS, calculateSpecialPoints, calculateTierLimit, TIER_OPTIONS } from './constants';

type Rules = typeof DEFAULT_POINTS;

// Helper component for tooltips
interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-black/80 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 invisible group-hover:visible z-10 pointer-events-none">
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
  tooltipText?: string;
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

  const labelElement = (
      <label htmlFor={id} className={`text-slate-300 text-sm leading-tight text-left ${tooltipText ? 'cursor-help' : ''}`}>{label}</label>
  );

  return (
    <div className="flex items-center justify-between gap-3 h-12">
      {tooltipText ? <Tooltip text={tooltipText}>{labelElement}</Tooltip> : labelElement}
      <div className={`flex items-center flex-shrink-0 bg-[var(--input-bg)] rounded-lg border ${value > 0 ? 'border-[var(--accent-color)]' : 'border-transparent'} focus-within:border-[var(--accent-color)] focus-within:ring-2 focus-within:ring-[var(--accent-color)]/50 transition-all duration-300`}>
        <button onClick={() => adjustValue(-1)} className="h-10 w-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-l-lg transition-colors" aria-label={`Decrease ${finalAriaLabel}`}>
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
        <button onClick={() => adjustValue(1)} className="h-10 w-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-r-lg transition-colors" aria-label={`Increase ${finalAriaLabel}`}>
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
        <div className="card-container w-full max-w-xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4 transition-all duration-300 md:hover:scale-[1.02] md:hover:shadow-[0_0_30px_rgba(0,120,212,0.2)] fade-in">
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
                    <NumberInput id={`neutral-card-${instanceIndex}`} label="Neutral Card" value={values.neutralCard} onValueChange={(v) => onValueChange('neutralCard', v)} tooltipText={`${rules.NEUTRAL_CARD} points per card`} />
                    <NumberInput id={`monster-card-${instanceIndex}`} label="Monster Card" value={values.monsterCard} onValueChange={(v) => onValueChange('monsterCard', v)} tooltipText={`${rules.MONSTER_CARD} points per card`} />
                    <NumberInput id={`card-conversion-${instanceIndex}`} label="Card Conversion" value={values.cardConversion} onValueChange={(v) => onValueChange('cardConversion', v)} tooltipText={`${rules.CARD_CONVERSION} points per card`} />
                    <NumberInput 
                        id={`normal-epiphany-${instanceIndex}`} 
                        label={<>Neutral/Monster<br/>Epiphany</>}
                        ariaLabel="Neutral Monster Epiphany"
                        value={values.normalEpiphany} 
                        onValueChange={(v) => onValueChange('normalEpiphany', v)} 
                        tooltipText={`${rules.NORMAL_EPIPHANY} points per card. Applies to both Neutral and Monster cards.`} 
                    />
                    <NumberInput id={`divine-epiphany-${instanceIndex}`} label="Divine Epiphany" value={values.divineEpiphany} onValueChange={(v) => onValueChange('divineEpiphany', v)} tooltipText={`${rules.DIVINE_EPIPHANY} points per card`} />
                    <NumberInput id={`forbidden-card-${instanceIndex}`} label="Forbidden Card" value={values.forbiddenCard} onValueChange={(v) => onValueChange('forbiddenCard', v)} tooltipText={`${rules.FORBIDDEN_CARD} points per card`} />
                </div>
                
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <div>
                        <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider">CARD REMOVAL/DUPLICATED</h3>
                        <div className="mt-1.5 h-[2px] w-full bg-[var(--accent-color)] rounded"></div>
                    </div>
                    <NumberInput id={`character-card-${instanceIndex}`} label="Character Card" value={values.characterCard} onValueChange={(v) => onValueChange('characterCard', v)} tooltipText={`${rules.CHARACTER_CARD} points per card`} />
                    <NumberInput id={`card-removed-${instanceIndex}`} label="Card Removed" value={values.cardRemoved} onValueChange={(v) => onValueChange('cardRemoved', v)} tooltipText="Points scale: 1=0, 2=10, 3=40, 4=90..." />
                    <NumberInput id={`card-duplication-${instanceIndex}`} label="Card Duplication" value={values.cardDuplication} onValueChange={(v) => onValueChange('cardDuplication', v)} tooltipText="Same scaling as Card Removed: 1=0, 2=10, 3=40..." />
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
                    <div className="flex items-center justify-center gap-2 text-red-300 text-xs fade-in">
                        <WarningIcon />
                        <span>Your deck might not be fully saved</span>
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
    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
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
            <main className="flex-grow text-white flex flex-wrap items-start justify-center p-4 gap-4 sm:p-8 sm:gap-8">
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
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="bg-[var(--card-bg-color)] border border-[var(--border-color)] text-white px-6 py-3 rounded-full shadow-2xl hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-300 font-semibold backdrop-filter backdrop-blur-lg"
                    aria-label="Edit Point Rules"
                >
                    Edit Point Rule
                </button>
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
        </div>
    );
};

export default App;
