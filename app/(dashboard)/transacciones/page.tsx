"use client";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Paper,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Delete, Edit, File, Plus, Table } from "lucide-react";
import React from "react";

const CashRegistersPage = () => {
  const [cashRegisters, setCashRegisters] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const handleAdd = () => {
    // Lógica para agregar una nueva caja
  };

  const handleEdit = (cashRegister: any) => {
    // Lógica para editar una caja existente
  };

  const handleDelete = (id: string) => {
    // Lógica para eliminar una caja
  };

  return (
    <PageContainer
      title="Movimientos"
      description="Administra los movimientos de tu negocio"
    >
      {/* HEADER */}
      <PageHeader title="Movimientos" />

      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField label="Buscar movimientos" variant="outlined" size="small" />
        <Button variant="contained" startIcon={<Plus />} onClick={handleAdd}>
          Nuevo Movimiento
        </Button>
      </Box>

      {/* Card Caja */}

      {/* TABLA */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {cashRegisters.length === 0 ? (
            <Box textAlign="center" py={6}>
              <File />
              <Typography variant="h6" mt={2}>
                No hay movimientos aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega tu primer movimiento
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* <TableContainer component={Paper} variant="outlined"> */}
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Identificación</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Nombre</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Correo</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Teléfono</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cashRegisters.map((cashRegister) => (
                    <TableRow
                      key={cashRegister.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      <TableCell>{cashRegister.identification}</TableCell>
                      <TableCell>{cashRegister.name}</TableCell>
                      <TableCell>{cashRegister.email}</TableCell>
                      <TableCell>{cashRegister.phone || "-"}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(cashRegister)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(cashRegister.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* </TableContainer> */}
            </Box>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </PageContainer>
  );
};

export default CashRegistersPage;
