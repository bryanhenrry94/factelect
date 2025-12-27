"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { UserPlus, Check, ChevronsUpDown } from "lucide-react";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import { cn } from "@/lib/utils";
import { PersonInput } from "@/lib/validations/person/person";
import { DocumentFiscalInfo } from "./DocumentFiscalInfo";
import { DocumentResponse } from "@/lib/validations";
import { useSession } from "next-auth/react";
import { getDocuments } from "@/actions";

interface DocumentInfoProps {
  modeEdit: boolean;
  persons: PersonInput[];
  onChangeTab?: (tab: string) => void;
}

export default function DocumentInfo({
  persons,
  modeEdit,
  onChangeTab,
}: DocumentInfoProps) {
  const { data: session } = useSession();

  // state
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);

  // form
  const { control, watch } = useFormContext();

  // observe
  const selectedPersonId = watch("personId");

  const fetchDocuments = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const params = {
        tenantId: session.user.tenantId,
        personId: selectedPersonId || "",
      };

      const response = await getDocuments(params);

      if (!response.success || !response.data) {
        setDocuments([]);
        return;
      }

      setDocuments(response.data);
    } catch (error) {
      console.error("Error loading documents", error);
      setDocuments([]);
    }
  };

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    fetchDocuments();
  }, [session?.user?.tenantId, selectedPersonId]);

  const selectedPerson = useMemo(
    () => persons.find((p) => p.id === selectedPersonId),
    [persons, selectedPersonId]
  );

  const handleAddPerson = () => {
    // abre una nueva pagina /personas/nuevo
    return () => {
      window.open("/personas/nuevo", "_blank");
    };
  };

  type AutorizathionFormProps = {
    documents: DocumentResponse[];
  };

  const AuthorizathionForm: React.FC<AutorizathionFormProps> = ({
    documents,
  }) => {
    return (
      <>
        <FormField
          control={control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de documento</FormLabel>
              <Input
                placeholder="000-000-000000000"
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="authorizationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de autorización</FormLabel>
              <Input
                placeholder="0000000000000000000000000000000000000000000000000"
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="authorizedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de autorización</FormLabel>
              <Input
                type="date"
                value={
                  field.value
                    ? new Date(field.value).toISOString().substring(0, 10)
                    : ""
                }
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="relatedDocumentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documento relacionado</FormLabel>
              <Select
                disabled={modeEdit}
                value={field.value || ""}
                onValueChange={(value) => {
                  field.onChange(value);
                  // handleChangeDocument(value);
                }}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Seleccione documento" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc: DocumentResponse) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {`FACT ${doc.number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );
  };

  return (
    <div>
      {/* ===================== DATOS GENERALES ===================== */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fecha */}
          <FormField
            control={control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de emisión</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={modeEdit}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().substring(0, 10)
                        : ""
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo Entidad */}
          <FormField
            control={control}
            name="entityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entidad</FormLabel>
                <Select
                  disabled={modeEdit}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Cliente / Proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Cliente</SelectItem>
                    <SelectItem value="SUPPLIER">Proveedor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo Documento */}
          <FormField
            control={control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento</FormLabel>
                <Select
                  disabled={modeEdit}
                  value={field.value}
                  onValueChange={(value) => {
                    if (value === "WITHHOLDING" && onChangeTab)
                      onChangeTab && onChangeTab("withholding_new");

                    if (value === "INVOICE" && onChangeTab)
                      onChangeTab("items");

                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de documento" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="INVOICE">Factura</SelectItem>
                    <SelectItem value="PURCHASE">
                      Liquidación de compra
                    </SelectItem>
                    <SelectItem value="CREDIT_NOTE">Nota de crédito</SelectItem>
                    <SelectItem value="DEBIT_NOTE">Nota de débito</SelectItem>
                    <SelectItem value="WITHHOLDING">
                      Comprobante de retención
                    </SelectItem>
                    <SelectItem value="REMISSION_GUIDE">
                      Guía de remisión
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* ===================== PERSONA ===================== */}
      <div className="mt-4">
        <FormField
          control={control}
          name="personId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persona</FormLabel>

              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {selectedPerson ? (
                          <span className="truncate">
                            <span className="text-muted-foreground mr-1">
                              [{selectedPerson.identification}]
                            </span>
                            {selectedPerson.businessName ||
                              `${selectedPerson.firstName} ${selectedPerson.lastName}`}
                          </span>
                        ) : (
                          "Selecciona una persona"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>

                  <PopoverContent className="w-[420px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar por nombre o cédula..." />
                      <CommandEmpty>No se encontraron personas</CommandEmpty>
                      <CommandGroup>
                        {persons.map((person) => (
                          <CommandItem
                            key={person.id}
                            value={person.id}
                            onSelect={() => field.onChange(person.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                person.businessName === field.value ||
                                  person.firstName === field.value ||
                                  person.lastName === field.value ||
                                  person.identification === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>
                                {person.businessName ||
                                  `${person.firstName} ${person.lastName}`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {person.identification}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Crear persona"
                  onClick={handleAddPerson()}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>

              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
