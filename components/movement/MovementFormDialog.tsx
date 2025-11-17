import {
  CreateMovement,
  createMovementSchema,
  Movement,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Dialog } from "@mui/material";
import { useForm } from "react-hook-form";

interface MovementFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMovement) => void;
  initialData?: CreateMovement;
}

export const MovementFormDialog: React.FC<MovementFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { control, handleSubmit, reset } = useForm<CreateMovement>({
    // resolver: zodResolver(createMovementSchema),
    // defaultValues: initialData || {
    //   type: "IN",
    //   accountId: "",
    //   transactionId: null,
    //   date: new Date(),
    //   reconciled: false,
    //   amount: 0,
    //   description: null,
    //   reference: null,
    // },
  });

  const onSubmitForm = (data: Movement) => {
    onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box p={3}>
        <h2>{initialData ? "Editar Movimiento" : "Registrar Movimiento"}</h2>
        {/* Formulario de movimiento (campos, validaciones, etc.) */}
        {/* Al enviar el formulario, llamar a onSubmit con los datos */}
      </Box>
    </Dialog>
  );
};
