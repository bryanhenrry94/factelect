"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray } from "react-hook-form";

import {
  createEmissionPoint,
  getEmissionPoint,
  getEmissionPoints,
  updateEmissionPoint,
} from "@/actions/emission-point";
import { getEstablishments } from "@/actions";
import {
  CreateEmissionPoint,
  EmissionPoint,
} from "@/lib/validations/e-invoicing/emission-point";
import { Establishment } from "@/lib/validations/e-invoicing/establishment";
import { notifyError, notifyInfo } from "@/lib/notifications";

/* shadcn */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { initialSequences } from "./initialSequence";
import { getDocumentTypeLabelV2 } from "@/utils/document";
import { getEmissionPointSequences } from "@/actions/emission-point-sequence";

interface EmissionPointDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  id?: string;
}

const EmissionPointDialog: React.FC<EmissionPointDialogProps> = ({
  open,
  onClose,
  onSuccess,
  id,
}) => {
  const { data: session } = useSession();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);

  const form = useForm<CreateEmissionPoint>({
    defaultValues: {
      establishmentId: "",
      code: "",
      description: "",
      sequences: initialSequences,
      isActive: true,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sequences",
  });

  /**
   * 🔁 Reset al editar
   */
  useEffect(() => {
    if (!id) return;

    const getData = async () => {
      const response = await getEmissionPoint(id);
      if (response.success && response.data) {
        const emissionPointData = response.data;

        const responseSequences = await getEmissionPointSequences(id);

        reset({
          establishmentId: emissionPointData.establishmentId,
          code: emissionPointData.code,
          description: emissionPointData.description || "",
          isActive: emissionPointData.isActive,
          sequences:
            responseSequences.success && responseSequences.data
              ? responseSequences.data
              : initialSequences,
        });
      }
    };

    getData();
  }, [id, reset]);

  /**
   * 📥 Cargar establecimientos
   */
  useEffect(() => {
    const fetchEstablishments = async () => {
      if (!session?.user?.tenantId) return;

      const result = await getEstablishments(session.user.tenantId);
      if (result.success) {
        setEstablishments(result.data || []);
      }
    };

    if (open) fetchEstablishments();
  }, [open, session?.user?.tenantId]);

  /**
   * 💾 Guardar
   */
  const onSubmit = async (data: CreateEmissionPoint) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId.");
        return;
      }

      const payload = {
        ...data,
        tenantId: session.user.tenantId,
      };

      const response = id
        ? await updateEmissionPoint(id!, payload)
        : await createEmissionPoint(payload);

      if (response.success) {
        notifyInfo(
          id
            ? "Punto de emisión actualizado correctamente"
            : "Punto de emisión creado correctamente"
        );
        await onSuccess();
        onClose();
      } else {
        notifyError(response.error || "Error al guardar el punto de emisión");
      }
    } catch (error) {
      console.error(error);
      notifyError("Ocurrió un error inesperado");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-1xl max-h-[90vh] flex flex-col">
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <DialogHeader>
              <DialogTitle>
                {id ? "Editar Punto de Emisión" : "Agregar Punto de Emisión"}
              </DialogTitle>
              <DialogDescription>
                {id
                  ? "Actualiza la información del punto de emisión."
                  : "Agrega un nuevo punto de emisión a tu base de datos."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 mt-4 mb-4">
              {/* Establecimiento */}
              <FormField
                control={form.control}
                name="establishmentId"
                rules={{ required: "El establecimiento es obligatorio" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Establecimiento</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un establecimiento" />
                        </SelectTrigger>
                        <SelectContent>
                          {establishments.map((est) => (
                            <SelectItem key={est.id} value={est.id || ""}>
                              {est.code} - {est.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Código */}
              <FormField
                control={form.control}
                name="code"
                rules={{
                  required: "El punto de emisión es obligatorio",
                  minLength: { value: 3, message: "Debe tener 3 dígitos" },
                  maxLength: { value: 3, message: "Debe tener 3 dígitos" },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Punto de Emisión</FormLabel>
                    <FormControl>
                      <Input placeholder="001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descripción */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Caja principal"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo Documento</TableHead>
                    <TableHead>Secuencia Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        {getDocumentTypeLabelV2(field.documentType)}
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`sequences.${index}.currentSequence` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  {...field}
                                  value={field.value || 1}
                                  className="text-right"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Activo */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Activo</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {id ? "Actualizar" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EmissionPointDialog;
