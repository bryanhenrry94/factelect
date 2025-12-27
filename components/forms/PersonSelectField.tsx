import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
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
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Control } from "react-hook-form";

type Person = {
  id: string;
  identification: string;
  businessName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

interface PersonSelectFieldProps {
  control: Control<any>;
  name: string;
  label?: string;
  persons: Person[];
  selectedPerson?: Person | null;
  placeholder?: string;
  disabled?: boolean;
  onAddPerson?: () => void;
}

export function PersonSelectField({
  control,
  name,
  label = "Persona",
  persons,
  selectedPerson,
  placeholder = "Selecciona una persona",
  disabled,
  onAddPerson,
}: PersonSelectFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={disabled}
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
                      placeholder
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
                    {persons.map((person) => {
                      const label =
                        person.businessName ||
                        `${person.firstName} ${person.lastName}`;

                      return (
                        <CommandItem
                          key={person.id}
                          value={person.id}
                          onSelect={() => field.onChange(person.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === person.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {person.identification}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {onAddPerson && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Crear persona"
                onClick={onAddPerson}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
          </div>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
