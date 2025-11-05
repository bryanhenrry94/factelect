"use client";

import { useState, useTransition } from "react";
import { uploadLogoAction } from "@/app/actions/supabase";
import { updateLogoUrl } from "@/app/actions/tenant";
import { AlertService } from "@/lib/alerts";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { CloudUpload, File } from "lucide-react";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import { useSession } from "next-auth/react";

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

interface UploadLogoFormProps {
  logoUrl?: string;
  accept?: string; // Por defecto .jpg, .jpeg, .png
}

const UploadLogoForm: React.FC<UploadLogoFormProps> = ({
  logoUrl,
  accept = ".jpg,.jpeg,.png",
}) => {
  const { data: session } = useSession();

  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(logoUrl || null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Mostrar vista previa si es imagen
    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }

    // Subir archivo al servidor
    startTransition(async () => {
      try {
        const tenantId = session?.user?.tenantId ?? "";

        if (!tenantId) {
          AlertService.showError("No se pudo obtener el ID del inquilino.");
          return;
        }

        const formData = new FormData();
        formData.append("tenantId", tenantId);
        formData.append("file", file);

        const result = await uploadLogoAction(formData);

        if (result.success && result.url) {
          await updateLogoUrl(tenantId, result.url);
          setPreview(result.url);
          AlertService.showSuccess("Logo subido correctamente.");
        } else {
          AlertService.showError(result.error || "Error al subir el logo.");
        }
      } catch (err) {
        console.error("Upload error:", err);
        AlertService.showError("Ocurrió un error inesperado al subir el logo.");
      }
    });
  };

  const isImage = preview && /\.(png|jpg|jpeg|gif)$/i.test(preview);

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2, textAlign: "center" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Subir logo
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Puedes subir una imagen (.png, .jpg, .jpeg).
        </Typography>

        {/* Vista previa del logo */}
        {preview ? (
          isImage ? (
            <Image
              src={preview}
              alt="Vista previa"
              width={220}
              height={180}
              style={{
                borderRadius: "12px",
                marginBottom: "16px",
                objectFit: "cover",
                border: "1px solid #ddd",
                transition: "all 0.3s ease",
              }}
            />
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
              mb={2}
            >
              <File size={48} />
              <Typography variant="caption" color="text.secondary">
                Archivo subido
              </Typography>
            </Box>
          )
        ) : (
          <Box
            sx={{
              height: 120,
              border: "1px dashed #ccc",
              borderRadius: 2,
              mb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              fontSize: 14,
            }}
          >
            No hay logo seleccionado
          </Box>
        )}

        <Button
          component="label"
          variant="contained"
          startIcon={
            isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <CloudUpload />
            )
          }
          disabled={isPending}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 3,
          }}
        >
          {isPending ? "Subiendo..." : "Seleccionar logo"}
          <VisuallyHiddenInput
            type="file"
            name="file"
            accept={accept}
            onChange={handleFileChange}
          />
        </Button>
      </Box>
    </Paper>
  );
};

export default UploadLogoForm;
