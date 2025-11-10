"use client";

import React from "react";
import { Dialog, CircularProgress, Typography, Box } from "@mui/material";

interface LoadingSRIProps {
  open: boolean;
}

const LoadingSRI: React.FC<LoadingSRIProps> = ({ open }) => {
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          borderRadius: 4,
          px: 4,
          py: 3,
        },
      }}
    >
      <Box
        sx={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <CircularProgress
          color="primary"
          size={60}
          thickness={4}
          sx={{ mb: 1 }}
        />
        <Typography variant="h6" fontWeight="500">
          Enviando comprobante al SRI...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Por favor espera unos segundos mientras se autoriza el comprobante.
        </Typography>
      </Box>
    </Dialog>
  );
};

export default LoadingSRI;
