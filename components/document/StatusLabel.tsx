"use client";
import { Typography } from "@mui/material";

const StatusLabel: React.FC<{ status: string }> = ({ status }) => {
  console.log("StatusLabel status: ", status);
  
  let color:
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" = "info";
  let label = "";

  switch (status) {
    case "DRAFT":
      color = "info";
      label = "Borrador";
      break;
    case "SENT":
      color = "primary";
      label = "Enviado";
      break;
    case "SIGNED":
      color = "warning";
      label = "Firmado";
      break;
    case "PENDING_AUTHORIZATION":
      color = "secondary";
      label = "Pendiente de Autorización";
      break;
    case "AUTHORIZED":
      color = "success";
      label = "Autorizado";
      break;
    case "REJECTED":
      color = "error";
      label = "Rechazado";
      break;
    default:
      color = "info";
      label = status;
  }

  return (
    <Typography
      variant="body2"
      sx={{
        px: 1,
        py: 0.5,
        borderRadius: 1,
        bgcolor: (theme) => theme.palette[color].light,
        color: (theme) => theme.palette[color].dark,
        fontWeight: 600,
      }}
      textAlign={"center"}
    >
      {label}
    </Typography>
  );
};

export default StatusLabel;
