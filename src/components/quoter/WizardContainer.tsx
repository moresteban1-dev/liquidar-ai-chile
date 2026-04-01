'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Step1EventType from './steps/Step1EventType';
import Step2EventDetails from './steps/Step2EventDetails';
import Step3Services from './steps/Step3Services';
import Step4Preferences from './steps/Step4Preferences';
import Step5LeadData from './steps/Step5LeadData';

// Wizard State Types
export interface QuoterState {
    [key: string]: any; // Permite indexación para almacenamiento JSON y Record<string, unknown>
    eventType: string;
    eventSubtype: string;
    date: Date | null;
    isFlexibleDate: boolean;
    location: string;
    venueStatus: 'TENGO_RECINTO' | 'NECESITO_RECINTO' | 'POR_DEFINIR';
    attendees: number;
    duration: '4H' | '8H' | 'MULTIPLE';
    selectedServices: string[];
    customServices: string[];
    budget: number;
    priorities: string[];
    isSustainable: boolean;
    needsPermits: 'SI_TODO' | 'SOLO_ASESORIA' | 'NO';
    comments: string;
    leadName: string;
    leadEmail: string;
    leadPhone: string;
    leadCompany: string;
    contactPreferences: ('EMAIL' | 'WHATSAPP' | 'PHONE')[];
}

const initialState: QuoterState = {
    eventType: '',
    eventSubtype: '',
    date: null,
    isFlexibleDate: false,
    location: '',
    venueStatus: 'POR_DEFINIR',
    attendees: 150,
    duration: '8H',
    selectedServices: [],
    customServices: [],
    budget: 5000000,
    priorities: [],
    isSustainable: false,
    needsPermits: 'NO',
    comments: '',
    leadName: '',
    leadEmail: '',
    leadPhone: '',
    leadCompany: '',
    contactPreferences: ['EMAIL', 'WHATSAPP']
};

export default function WizardContainer() {
    const [currentStep, setCurrentStep] = useState(1);
    const [state, setState] = useState<QuoterState>(initialState);
    const totalSteps = 5;

    const handleNext = () => {
        if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const updateState = (updates: Partial<QuoterState>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    // Calculate progress bar width
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            {/* Header & Progress */}
            <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {currentStep > 1 && (
                        <button
                            onClick={handleBack}
                            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center text-sm font-medium"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            Volver
                        </button>
                    )}
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                        Paso {currentStep} de {totalSteps}
                    </span>
                </div>
                {/* Progress Bar Container */}
                <div className="hidden sm:block w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Dynamic Step Content */}
            <div className="p-6 sm:p-10 relative overflow-hidden min-h-[500px]">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Step1EventType state={state} updateState={updateState} onNext={handleNext} />
                        </motion.div>
                    )}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Step2EventDetails state={state} updateState={updateState} onNext={handleNext} onBack={handleBack} />
                        </motion.div>
                    )}
                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Step3Services state={state} updateState={updateState} onNext={handleNext} onBack={handleBack} />
                        </motion.div>
                    )}
                    {currentStep === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Step4Preferences state={state} updateState={updateState} onNext={handleNext} onBack={handleBack} />
                        </motion.div>
                    )}
                    {currentStep === 5 && (
                        <motion.div
                            key="step5"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Step5LeadData state={state} updateState={updateState} onBack={handleBack} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Progress Bar (visible only on small screens) */}
            <div className="sm:hidden w-full bg-neutral-200 dark:bg-neutral-800 h-1">
                <div
                    className="bg-blue-600 h-1 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
