import { deleteEmissionPoint, getEmissionPoints } from "@/app/actions";
import { AlertService } from "@/lib/alerts";
import {
  EmissionPoint,
  EmissionPointWithEstablishmentSchema,
} from "@/lib/validations";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Delete, Edit, PlusCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import EmissionPointDialog from "./emission-point-dialog";

export const EmissionPointForm = () => {
  const [emissionPoints, setEmissionPoints] = useState<
    EmissionPointWithEstablishmentSchema[]
  >([]);
  const [open, setOpen] = useState(false);
  const [editingEmissionPoint, setEditingEmissionPoint] =
    useState<EmissionPoint | null>(null);
  const { data: session } = useSession();

  const fetchEmissionPoints = useCallback(async () => {
    if (!session?.user?.tenantId) return;
    const result = await getEmissionPoints(session.user.tenantId);
    if (result.success) setEmissionPoints(result.data || []);
  }, [session?.user?.tenantId]);

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchEmissionPoints();
    }
  }, [session?.user?.tenantId, fetchEmissionPoints]);

  const handleDeleteEmissionPoint = async (id: string) => {
    if (!id) return;
    const confirm = await AlertService.showConfirm(
      "¿Eliminar este punto de emisión?",
      "Esta acción no se puede deshacer."
    );
    if (!confirm) return;

    const result = await deleteEmissionPoint(id);
    result.success
      ? (AlertService.showSuccess("Punto de emisión eliminado."),
        fetchEmissionPoints())
      : AlertService.showError("Error al eliminar el punto de emisión.");
  };

  return (
    <Box>
      {/* Puntos de Emisión */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="body1">Puntos de Emisión</Typography>
          <Typography variant="caption" color="text.secondary">
            Configure los puntos de emisión asociados a sus establecimientos.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Establecimiento</TableCell>
                  <TableCell>Punto</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emissionPoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay puntos de emisión registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  emissionPoints.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.establishment?.code}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.isActive ? "Activo" : "Inactivo"}
                          color={item.isActive ? "primary" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setEditingEmissionPoint(item);
                            setOpen(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() =>
                            handleDeleteEmissionPoint(item.id ?? "")
                          }
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} align="right">
                    <Button
                      variant="text"
                      startIcon={<PlusCircle />}
                      onClick={() => {
                        setEditingEmissionPoint(null);
                        setOpen(true);
                      }}
                    >
                      Nuevo Punto de Emisión
                    </Button>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <EmissionPointDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={fetchEmissionPoints}
        editingData={editingEmissionPoint}
      />
    </Box>
  );
};
