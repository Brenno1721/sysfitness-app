import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setHapticsEnabledFlag } from '../lib/haptics';

const HAPTICS_KEY = 'settings:hapticsEnabled';

type SettingsContextValue = {
  hapticsEnabled: boolean;
  setHapticsEnabled: (value: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(HAPTICS_KEY).then((raw) => {
      const value = raw !== null ? JSON.parse(raw) : true;
      setHapticsEnabledState(value);
      setHapticsEnabledFlag(value);
    });
  }, []);

  const setHapticsEnabled = useCallback((value: boolean) => {
    setHapticsEnabledState(value);
    setHapticsEnabledFlag(value);
    AsyncStorage.setItem(HAPTICS_KEY, JSON.stringify(value));
  }, []);

  return (
    <SettingsContext.Provider value={{ hapticsEnabled, setHapticsEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings precisa estar dentro de <SettingsProvider>');
  return ctx;
}
