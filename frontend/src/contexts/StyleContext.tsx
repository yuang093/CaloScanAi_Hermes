'use client';
import { createContext, useContext, useState, useEffect } from 'react';

type Style = 'v1' | 'v3' | 'v5';

interface StyleContextType {
  style: Style;
  setStyle: (s: Style) => void;
}

const StyleContext = createContext<StyleContextType>({ style: 'v1', setStyle: () => {} });

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyleState] = useState<Style>('v1');

  useEffect(() => {
    const saved = localStorage.getItem('caloscan-preferred-style') as Style | null;
    if (saved) setStyleState(saved);
  }, []);

  const setStyle = (s: Style) => {
    setStyleState(s);
    localStorage.setItem('caloscan-preferred-style', s);
  };

  return <StyleContext.Provider value={{ style, setStyle }}>{children}</StyleContext.Provider>;
}

export const useStyle = () => useContext(StyleContext);