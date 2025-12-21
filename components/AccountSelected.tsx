import { ChartOfAccount } from "@/lib/validations";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { cn } from "@/lib/utils";

interface AccountSelectProps {
  label: string;
  accounts: ChartOfAccount[];
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
}

export function AccountSelect({
  label,
  accounts,
  value,
  onChange,
  disabled,
}: AccountSelectProps) {
  const selected = accounts.find((a) => a.id === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between px-3 font-normal",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selected ? `${selected.code} - ${selected.name}` : label}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput placeholder="Buscar cuenta..." />
          <CommandList>
            <CommandEmpty>No hay resultados</CommandEmpty>
            <CommandItem value="none" onSelect={() => onChange(null)}>
              <span className="text-sm text-muted-foreground">
                Selecciona una cuenta
              </span>
            </CommandItem>
            {accounts.map((a) => (
              <CommandItem
                key={a.id}
                value={`${a.code} ${a.name}`}
                onSelect={() => onChange(a.id)}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    value === a.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">
                  {a.code} - {a.name}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
