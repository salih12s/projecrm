import React from 'react';
import { Dialog, Box, CircularProgress, Typography } from '@mui/material';

interface Props {
  open: boolean;
}

const PhotoLoadingOverlay: React.FC<Props> = ({ open }) => (
  <Dialog
    open={open}
    PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden' } }}
  >
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
      <CircularProgress sx={{ color: 'white' }} />
      <Typography sx={{ color: 'white', mt: 2 }}>Fotoğraflar yükleniyor...</Typography>
    </Box>
  </Dialog>
);

export default PhotoLoadingOverlay;
