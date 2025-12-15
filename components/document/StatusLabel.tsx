"use client";

import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface StatusLabelProps {
  status: string;
}

const statusVariants = cva(
  "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        draft: "bg-sky-100 text-sky-700",
        sent: "bg-blue-100 text-blue-700",
        signed: "bg-amber-100 text-amber-700",
        pending: "bg-purple-100 text-purple-700",
        authorized: "bg-emerald-100 text-emerald-700",
        rejected: "bg-red-100 text-red-700",
        default: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const STATUS_MAP: Record<
  string,
  {
    label: string;
    variant:
      | "draft"
      | "sent"
      | "signed"
      | "pending"
      | "authorized"
      | "rejected"
      | "default";
  }
> = {
  DRAFT: {
    label: "Borrador",
    variant: "draft",
  },
  SENT: {
    label: "Enviado",
    variant: "sent",
  },
  SIGNED: {
    label: "Firmado",
    variant: "signed",
  },
  PENDING_AUTHORIZATION: {
    label: "Pendiente de Autorización",
    variant: "pending",
  },
  AUTHORIZED: {
    label: "Autorizado",
    variant: "authorized",
  },
  REJECTED: {
    label: "Rechazado",
    variant: "rejected",
  },
};

const StatusLabel: React.FC<StatusLabelProps> = ({ status }) => {
  const config = STATUS_MAP[status] ?? {
    label: status,
    variant: "default",
  };

  return (
    <span
      className={cn(
        statusVariants({
          variant: config.variant,
        })
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusLabel;
