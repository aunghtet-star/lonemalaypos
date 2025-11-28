import React, { ReactNode } from 'react';

// ThemeContext removed - dark mode feature deprecated.

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
