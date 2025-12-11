import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FilterCardProps {
  title: string;
  count: number;
  icon?: React.ElementType;
  color?: "blue" | "sky" | "green" | "yellow";
  onClick?: () => void;
}

const colorClassMap = {
  blue: {
    card: "bg-blue-100 dark:bg-blue-900",
    icon: "bg-blue-500 text-white",
    text: "text-blue-900 dark:text-blue-100",
  },
  sky: {
    card: "bg-sky-100 dark:bg-sky-900",
    icon: "bg-sky-500 text-white",
    text: "text-sky-900 dark:text-sky-100",
  },
  green: {
    card: "bg-green-100 dark:bg-green-900",
    icon: "bg-green-500 text-white",
    text: "text-green-900 dark:text-green-100",
  },
  yellow: {
    card: "bg-yellow-100 dark:bg-yellow-900",
    icon: "bg-yellow-500 text-white",
    text: "text-yellow-900 dark:text-yellow-100",
  },
};

export default function FilterCard({
  title,
  count,
  icon: Icon = Users,
  color = "blue",
  onClick,
}: FilterCardProps) {
  const colors = colorClassMap[color];
  return (
    <Card
      className={cn("min-w-[180px] shadow-none transition-colors", colors.card)}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 w-full p-4 bg-transparent hover:bg-muted/50 rounded-lg transition-colors"
      >
        <span
          className={cn(
            "min-w-[50px] min-h-[50px] flex items-center justify-center rounded-lg mr-3",
            colors.icon
          )}
        >
          <Icon size={22} />
        </span>
        <CardContent className="p-0">
          <div className={cn("font-medium text-base", colors.text)}>
            {title}
          </div>
          <div className="font-semibold text-sm">{count} Personas</div>
        </CardContent>
      </button>
    </Card>
  );
}
