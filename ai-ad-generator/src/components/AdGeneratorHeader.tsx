import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const AdGeneratorHeader: React.FC = () => {
  return (
    <Paper elevation={0} sx={{ p: 3, mb: 4, backgroundColor: 'primary.main', color: 'white' }}>
      <Box>
        <Typography variant="h1" component="h1" gutterBottom>
          AI Ad Generator
        </Typography>
        <Typography variant="h6" component="h2">
          Transform your reference ads into brand-aligned creative content
        </Typography>
      </Box>
    </Paper>
  );
};

export default AdGeneratorHeader; 