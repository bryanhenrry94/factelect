"use client";

import { Control } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StepProps = {
  control: Control<any>;
};

export const TenantStep: React.FC<StepProps> = ({ control }) => {
  return (
    <div className="space-y-6 mt-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">(1/2)</p>
        <h2 className="text-xl font-semibold">Datos del contribuyente</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Registra la información del contribuyente.
        </p>
      </div>

      <div className="space-y-4">
        {/* RUC */}
        <FormField
          control={control}
          name="ruc"
          rules={{
            required: "El RUC es obligatorio",
            pattern: {
              value: /^\d{13}$/,
              message: "El RUC debe tener 13 dígitos",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>RUC</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa el RUC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nombre / Razón social */}
        <FormField
          control={control}
          name="legalName"
          rules={{ required: "El nombre de la empresa es obligatorio" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre / Razón Social</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nombre Comercial */}
        <FormField
          control={control}
          name="tradeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Comercial</FormLabel>
              <FormControl>
                <Input placeholder="Nombre Comercial" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dirección */}
        <FormField
          control={control}
          name="tenantAddress"
          rules={{ required: "La dirección es obligatoria" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Dirección fiscal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo Contribuyente */}
        <FormField
          control={control}
          name="contributorType"
          rules={{ required: "El tipo de contribuyente es obligatorio" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Contribuyente</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="NATURAL">Natural</SelectItem>
                      <SelectItem value="SOCIETY">Sociedad</SelectItem>
                      <SelectItem value="SPECIAL">
                        Contribuyente Especial
                      </SelectItem>
                      <SelectItem value="PUBLIC">Entidad Pública</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Régimen Tributario */}
        <FormField
          control={control}
          name="taxRegime"
          rules={{ required: "El régimen tributario es obligatorio" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Régimen Tributario</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="RIMPE_EMPRENDEDOR">
                        RIMPE Emprendedor
                      </SelectItem>
                      <SelectItem value="RIMPE_NEGOCIO_POPULAR">
                        RIMPE Negocio Popular
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
