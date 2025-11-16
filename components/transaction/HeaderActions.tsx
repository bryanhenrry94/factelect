"use client";
import { Box, Button, Stack } from "@mui/material";
import { Save } from "lucide-react";
import { useFormContext } from "react-hook-form";

interface HeaderActionsProps {
  modeEdit?: boolean;
}

export default function HeaderActions({ modeEdit }: HeaderActionsProps) {
  const {
    formState: { isSubmitting },
    watch,
  } = useFormContext();

  const total = watch("total");

  return (
    <Box display="flex" justifyContent="flex-end" gap={2} mb={2}>
      <Stack direction="row" spacing={2}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<Save />}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {modeEdit ? "Actualizar" : "Guardar"}
        </Button>
      </Stack>
    </Box>
  );
}
