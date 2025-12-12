"use client";

import { Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type StepProps = {
  control: any;
  errors: any;
};

export const TermsStep: React.FC<StepProps> = ({ control, errors }) => {
  return (
    <div className="mt-4 space-y-6">
      {/* Encabezado */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">(1/3)</p>
        <h2 className="text-xl font-semibold">Términos y Condiciones</h2>
        <p className="text-sm text-muted-foreground">
          Acepta nuestros términos para completar tu registro.
        </p>
      </div>

      {/* Contenido del texto */}
      <div className="p-4 rounded-md bg-muted/40 space-y-3 text-sm leading-relaxed">
        <p>
          Al registrarte en Factelect, aceptas nuestros términos de servicio y
          política de privacidad. Tu información será tratada con la máxima
          confidencialidad y utilizada únicamente para la prestación de nuestros
          servicios de facturación electrónica.
        </p>

        <p>
          Para más detalles, puedes revisar nuestros{" "}
          <Link
            href="/terms"
            className="text-primary underline-offset-2 hover:underline"
          >
            términos completos
          </Link>{" "}
          y{" "}
          <Link
            href="/privacy"
            className="text-primary underline-offset-2 hover:underline"
          >
            política de privacidad
          </Link>
          .
        </p>

        {/* Checkbox */}
        <Controller
          name="acceptTerms"
          control={control}
          rules={{ required: "Debes aceptar los términos y condiciones" }}
          render={({ field }) => (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={field.value ?? false}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                <Label htmlFor="acceptTerms" className="cursor-pointer text-sm">
                  Acepto los términos y condiciones de uso
                </Label>
              </div>

              {errors.acceptTerms && (
                <p className="text-sm text-destructive">
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
};
