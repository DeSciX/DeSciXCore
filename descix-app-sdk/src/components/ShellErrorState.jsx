/**
 * ShellErrorState — the shell's one error screen: a title, a plain sentence, and an optional
 * retry. ShellContent (AppShell.jsx) shows it for the ERROR state; SdkInitializer shows it when the
 * app binding cannot be read (util/appBinding.js).
 */
import React from 'react';
import { Box, Button, Typography } from '@mui/material';

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.message
 * @param {string} [props.detail] - the technical cause, shown small under the message
 * @param {() => void} [props.onRetry] - when given, a "Try again" button calls it
 */
export default function ShellErrorState({ title, message, detail, onRetry }) {
  return (
    <Box sx={{ padding: 3 }} role="alert">
      <Typography variant="h4" align="center" color="error" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" align="center" gutterBottom>
        {message}
      </Typography>
      {detail ? (
        <Typography variant="body2" align="center" color="text.secondary" gutterBottom sx={{ fontFamily: 'monospace' }}>
          {detail}
        </Typography>
      ) : null}
      {onRetry ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="contained" onClick={onRetry}>Try again</Button>
        </Box>
      ) : null}
    </Box>
  );
}
