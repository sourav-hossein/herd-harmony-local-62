
import React from 'react';

interface ElectronGuardProps {
  children: React.ReactNode;
}

export default function ElectronGuard({ children }: ElectronGuardProps) {
  // Allow both Electron and browser environments
  return <>{children}</>;
}
