"use client";
import { useCallback, useEffect, useState } from "react";
import { Establishment } from "@/lib/validations";
import { useSession } from "next-auth/react";
import {
  deleteEstablishment,
  getEstablishments,
} from "@/actions/establishment";
import { AlertService } from "@/lib/alerts";
import {
  Box,
  Button,
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
import EstablishmentDialog from "./establishment-dialog";
import { notifyError, notifyInfo } from "@/lib/notifications";

export const EstablishmentForm = () => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [open, setOpen] = useState(false);
  const [establishmentSelected, setEstablishmentSelected] =
    useState<Establishment | null>(null);
  const { data: session } = useSession();

  const fetchEstablishments = useCallback(async () => {
    if (!session?.user?.tenantId) return;
    const result = await getEstablishments(session?.user?.tenantId);
    if (result.success) setEstablishments(result.data || []);
  }, [session?.user?.tenantId]);

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchEstablishments();
    }
  }, [session?.user?.tenantId, fetchEstablishments]);

  const handleDeleteEstablishment = async (id: string) => {
    if (!id) return;
    const confirm = await AlertService.showConfirm(
      "¿Eliminar este establecimiento?",
      "Esta acción eliminará todos los datos asociados. ¿Desea continuar?"
    );
    if (!confirm) return;

    const result = await deleteEstablishment(id);
    result.success
      ? (notifyInfo("Eliminando establecimiento..."), fetchEstablishments())
      : notifyError("Error al eliminar el establecimiento");
  };

  return (
    <Box>
      {/* Establecimientos */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="body1">Establecimientos</Typography>
          <Typography variant="caption" color="text.secondary">
            Configure los establecimientos registrados en el SRI.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell align="right">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {establishments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No hay establecimientos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  establishments.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.address}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setEstablishmentSelected(item);
                            setOpen(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() =>
                            handleDeleteEstablishment(item.id ?? "")
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
                  <TableCell colSpan={3} align="right">
                    <Button
                      variant="text"
                      startIcon={<PlusCircle />}
                      onClick={() => {
                        setEstablishmentSelected(null);
                        setOpen(true);
                      }}
                    >
                      Nuevo Establecimiento
                    </Button>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <EstablishmentDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={fetchEstablishments}
        establishmentSelected={establishmentSelected}
      />
    </Box>
  );
};
