/**
 * ShellFrame — the shell's full-height themed container. AppShell puts ShellContent in it, and
 * SdkInitializer puts its binding error in it, so both error screens look the same.
 */
import React from 'react';
import { Box } from '@mui/material';

export default function ShellFrame({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0D1117' }}>
      {children}
    </Box>
  );
}
