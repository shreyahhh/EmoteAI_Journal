import React, { useState } from 'react';
import { addDays } from '../../models/cycleCalculations';
import SetupWelcome from './SetupWelcome';
import SetupLastPeriod from './SetupLastPeriod';
import SetupRhythm from './SetupRhythm';

/** First-time (skippable) setup: 1.1 Welcome -> 1.2 Last period -> 1.3 Your rhythm. */
const SetupFlow = ({ data, onDone }) => {
  const [step, setStep] = useState('welcome');
  const [lastPeriodDate, setLastPeriodDate] = useState(null);

  const handleSkip = async () => {
    await data.saveSettings({});
    onDone();
  };

  const handleFinish = async ({ cycleLength, periodLength, irregular }) => {
    await data.saveSettings({
      avgCycleLength: cycleLength,
      avgPeriodLength: periodLength,
      irregular,
      enabled: true,
    });
    if (lastPeriodDate) {
      await data.savePeriodRange({
        startDate: lastPeriodDate,
        endDate: addDays(lastPeriodDate, periodLength - 1),
      });
    }
    onDone();
  };

  if (step === 'welcome') {
    return <SetupWelcome onStart={() => setStep('lastPeriod')} onSkip={handleSkip} />;
  }
  if (step === 'lastPeriod') {
    return (
      <SetupLastPeriod
        onBack={() => setStep('welcome')}
        onContinue={({ lastPeriodDate: picked }) => {
          setLastPeriodDate(picked);
          setStep('rhythm');
        }}
      />
    );
  }
  return <SetupRhythm lastPeriodDate={lastPeriodDate} onBack={() => setStep('lastPeriod')} onFinish={handleFinish} />;
};

export default SetupFlow;
