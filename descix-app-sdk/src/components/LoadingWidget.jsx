import React, {use, useEffect} from 'react';
import { Box, Typography, Button, Link, CircularProgress } from '@mui/material';
import { useAppContext } from '../AppContext';  // Import useAppContext

const LoadingWidget = () => {
  // No longer needed: const { setAppEvent } = useAppContext();
  const { isEmbedded } = useAppContext();
  useEffect(() => {
    console.log("Rendering LoadingWidget: isEmbedded = ", isEmbedded);
  }, []);
  // This component is now much simpler.  It's ONLY used for the non-embedded, no-context case.
  // The App.js component handles rendering this.
  return (
        <Box sx={{ padding: 3 }}>
      
    
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', width: '80vw' }}>
      <Typography variant="h3" sx={{ mt: 2 }}>DeSciX is Loading ...</Typography>
      <br />
        <CircularProgress />
        
      </Box>
    </Box>
  );
};

export default LoadingWidget;