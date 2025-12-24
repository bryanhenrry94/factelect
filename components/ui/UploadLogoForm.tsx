"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { CloudUpload, File } from "lucide-react";

import { uploadLogoAction } from "@/actions/supabase";
import { updateLogoUrl } from "@/actions/tenant";
import { notifyError, notifyInfo } from "@/lib/notifications";

/* shadcn */
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";

interface UploadLogoFormProps {
  logoUrl?: string;
  accept?: string;
}

export default function UploadLogoForm({
  logoUrl,
  accept = ".jpg,.jpeg,.png",
}: UploadLogoFormProps) {
  const { data: session } = useSession();

  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(logoUrl || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Preview
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }

    startTransition(async () => {
      try {
        const tenantId = session?.user?.tenantId;

        if (!tenantId) {
          setError("No se pudo obtener el ID de la empresa.");
          notifyError("No se pudo obtener el ID de la empresa.");
          return;
        }

        const formData = new FormData();
        formData.append("tenantId", tenantId);
        formData.append("file", file);

        const result = await uploadLogoAction(formData);

        if (result.success && result.url) {
          await updateLogoUrl(tenantId, result.url);
          setPreview(result.url);
          notifyInfo("Logo subido correctamente.");
        } else {
          const msg = result.error || "Error al subir el logo.";
          setError(msg);
          notifyError(msg);
        }
      } catch (error) {
        console.error(error);
        setError("Ocurrió un error inesperado.");
        notifyError("Ocurrió un error inesperado.");
      }
    });
  };

  const isImage = preview && /\.(png|jpg|jpeg|gif)$/i.test(preview);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Logo de la empresa</CardTitle>
        <CardDescription>Sube una imagen (.png, .jpg, .jpeg).</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="flex justify-center">
          {preview ? (
            isImage ? (
              <div className="relative h-36 w-56 rounded-lg border overflow-hidden">
                <Image
                  src={preview}
                  alt="Vista previa del logo"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <File size={40} />
                <span className="text-sm">Archivo subido</span>
              </div>
            )
          ) : (
            <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No hay logo seleccionado
            </div>
          )}
        </div>

        <Separator />

        {/* Upload field */}
        <div className="space-y-2">
          <Label className="sr-only">Subir logo</Label>

          <Button asChild disabled={isPending} className="w-full">
            <label className="flex cursor-pointer items-center justify-center gap-2">
              <CloudUpload className="h-4 w-4" />
              {isPending ? "Subiendo..." : "Seleccionar logo"}
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Tamaño recomendado: 300x200 px
        </p>
      </CardContent>
    </Card>
  );
}
