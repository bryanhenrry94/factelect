"use client";

import { useMemo } from "react";
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
import { PersonInput } from "@/lib/validations/person";
import { DocumentFiscalInfo } from "./DocumentFiscalInfo";

interface DocumentInfoProps {
  modeEdit: boolean;
  persons: PersonInput[];
}

export default function DocumentInfo({ persons, modeEdit }: DocumentInfoProps) {
  const { control, watch } = useFormContext();

  const selectedPersonId = watch("personId");

  const selectedPerson = useMemo(
    () => persons.find((p) => p.id === selectedPersonId),
    [persons, selectedPersonId]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Fecha */}
      <FormField
        control={control}
        name="issueDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de Emisión</FormLabel>
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
            <FormLabel>Tipo</FormLabel>
            <Select
              disabled={modeEdit}
              value={field.value}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
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
            <FormLabel>Tipo de Documento</FormLabel>
            <Select
              disabled={modeEdit}
              value={field.value}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona documento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="INVOICE">Factura</SelectItem>
                <SelectItem value="CREDIT_NOTE">Nota de Crédito</SelectItem>
                <SelectItem value="DEBIT_NOTE">Nota de Débito</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Persona (Buscable) */}
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
                        "justify-between w-full",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {selectedPerson
                        ? `[${selectedPerson.identification}] ${selectedPerson.firstName} ${selectedPerson.lastName}`
                        : "Selecciona una persona"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar persona..." />
                    <CommandEmpty>No se encontraron resultados</CommandEmpty>
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
                              person.id === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          [{person.identification}] {person.firstName}{" "}
                          {person.lastName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button type="button" variant="ghost" size="icon">
                <UserPlus className="h-5 w-5" />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Info Fiscal */}
      <DocumentFiscalInfo
        modeEdit={modeEdit}
        documentType={watch("documentType") || "INVOICE"}
      />
    </div>
  );
}
