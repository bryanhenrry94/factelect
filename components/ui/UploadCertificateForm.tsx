"use client";

import { useTransition } from "react";
import { uploadCertificateAction } from "@/actions/supabase";
import { updateCertificatePath } from "@/actions/tenant-sri-config";
import { notifyError, notifyInfo } from "@/lib/notifications";

import { Cloud, CloudCheck, CloudUpload } from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  const handleSubmit = (formData: FormData) => {
    formData.append("tenantId", tenantId);

    startTransition(async () => {
      const result = await uploadCertificateAction(formData);

      if (result.success) {
        await updateCertificatePath(
          tenantId,
          result.path || "",
          result.url || ""
        );
        notifyInfo("Certificado subido correctamente.");
        onSave();
      } else {
        notifyError("Error al subir el certificado.");
      }
    });
  };

  return (
    <Card className="p-6 text-center space-y-4 border-dashed">
      {/* Estado */}
      <div className="flex flex-col items-center gap-2">
        {certificatePath ? (
          <>
            <CloudCheck className="h-10 w-10 text-primary" />
            <p className="text-sm font-medium">Certificado subido con éxito</p>
          </>
        ) : (
          <>
            <Cloud className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">
              No se ha subido ningún certificado
            </p>
          </>
        )}
      </div>

      {/* Upload */}
      <form action={handleSubmit} className="flex justify-center">
        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          className={cn(
            "relative",
            isPending && "cursor-not-allowed opacity-70"
          )}
        >
          <CloudUpload className="mr-2 h-4 w-4" />
          {isPending
            ? "Subiendo..."
            : certificatePath
            ? "Actualizar Certificado .p12"
            : "Subir Certificado .p12"}

          {/* Input oculto */}
          <input
            type="file"
            name="file"
            accept=".p12"
            required
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => {
              if (e.target.files?.length) {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </Button>
      </form>
    </Card>
  );
};

export default UploadCertificateForm;
