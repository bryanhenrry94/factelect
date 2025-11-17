"use client";

import { useTransition } from "react";
import { uploadCertificateAction } from "@/app/actions/supabase";
import { updateCertificatePath } from "@/app/actions/tenant-sri-config";
import { Button, Paper, Typography } from "@mui/material";
import {
  CheckCircle2,
  Cloud,
  CloudCheck,
  CloudUploadIcon,
  File,
  Upload,
} from "lucide-react";
import { styled } from "@mui/material/styles";
import { AlertService } from "@/lib/alerts";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface UploadCertificateFormProps {
  tenantId: string;
  certificatePath: string | null;
  onSave: () => void;
}

const UploadCertificateForm: React.FC<UploadCertificateFormProps> = ({
  tenantId,
  certificatePath,
  onSave,
}) => {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("tenantId", tenantId);

    startTransition(async () => {
      const result = await uploadCertificateAction(formData);
      console.log("Result: ", result);

      if (result.success) {
        await updateCertificatePath(
          tenantId,
          result.path || "",
          result.url || ""
        );
        AlertService.showSuccess("Certificado subido correctamente.");
        onSave();
      } else {
        AlertService.showError("Error al subir el certificado.");
      }
    });
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        textAlign: "center",
      }}
    >
      <form onSubmit={handleSubmit}>
        {certificatePath ? (
          <>
            <CloudCheck size={48} color="#1976d2" />
            <Typography variant="body2" fontWeight="medium">
              Certificado subido con éxito
            </Typography>
          </>
        ) : (
          <>
            <Cloud size={48} color="#1976d2" />
            <Typography variant="body2" fontWeight="medium">
              No se ha subido ningún certificado
            </Typography>
          </>
        )}

        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          disabled={isPending}
          sx={{ mt: 2 }}
        >
          {isPending
            ? "Subiendo..."
            : `${
                certificatePath
                  ? "Actualizar Certificado .p12"
                  : "Subir Certificado .p12"
              }`}
          <VisuallyHiddenInput
            type="file"
            name="file"
            accept=".p12"
            required
            onChange={(event) => {
              if (event.target.files && event.target.files[0]) {
                const form = event.target.closest("form") as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }
            }}
          />
        </Button>
      </form>
    </Paper>
  );
};

export default UploadCertificateForm;
