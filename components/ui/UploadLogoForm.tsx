"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { CloudUpload, FileCheck } from "lucide-react";

import { uploadLogoAction } from "@/actions/supabase";
import { updateLogoUrl } from "@/actions/setting/tenant";
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
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Si viene logoUrl desde props, lo usamos como preview inicial
  useEffect(() => {
    if (logoUrl) {
      setPreview(logoUrl);
    } else {
      setPreview(null);
    }
  }, [logoUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Preview inmediato
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    }

    startTransition(async () => {
      try {
        const tenantId = session?.user?.tenantId;

        if (!tenantId) {
          const msg = "No se pudo obtener el ID de la empresa.";
          setError(msg);
          notifyError(msg);
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
      } catch (err) {
        console.error(err);
        const msg = "Ocurrió un error inesperado.";
        setError(msg);
        notifyError(msg);
      }
    });
  };

  const hasLogo = Boolean(preview);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Logo de la empresa</CardTitle>
        <CardDescription>
          {hasLogo
            ? "El logo actual de tu empresa."
            : "Aún no has cargado un logo. Sube una imagen (.png, .jpg, .jpeg)."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview solo si hay logo */}
        {hasLogo && (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="relative h-36 w-56 rounded-lg border overflow-hidden">
                <Image
                  src={preview!}
                  alt="Logo de la empresa"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileCheck className="h-4 w-4" />
                Logo cargado
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Upload field */}
        <div className="space-y-2">
          <Label className="sr-only">Subir logo</Label>

          <Button asChild disabled={isPending} className="w-full">
            <label className="flex cursor-pointer items-center justify-center gap-2">
              <CloudUpload className="h-4 w-4" />
              {isPending
                ? "Subiendo..."
                : hasLogo
                ? "Cambiar logo"
                : "Subir logo"}
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
