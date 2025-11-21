import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BoxIcon } from "lucide-react";

export const BillingForm = () => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        {/* Invoices Tab Content */}
        <Card>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom>
              Información de Facturación
            </Typography>
            <Alert severity="info">Funcionalidad en desarrollo</Alert>

            <TextField
              label="Nombre de la Empresa"
              value="Dazzsoft S.A.C"
              fullWidth
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
            />

            <TextField
              label="RUC"
              value="20612345678"
              fullWidth
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
            />

            <TextField
              label="Dirección"
              value="Av. Siempre Viva 123, Lima, Perú"
              fullWidth
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
            />

            <TextField
              label="Correo Electrónico"
              value="info@dazzsoft.com"
              fullWidth
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
            />
          </CardContent>
          <CardActions sx={{ p: 3 }}>
            <Button variant="contained" color="primary" size="large">
              Guardar
            </Button>
          </CardActions>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 12 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                      Plan Actual
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gestiona tu plan de suscripción
                    </Typography>
                    <Alert severity="info">Funcionalidad en desarrollo</Alert>
                  </Box>
                  <Chip
                    label="Activo"
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    backgroundColor: "action.hover",
                    borderRadius: 2,
                    gap: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 56,
                      height: 56,
                      backgroundColor: "primary.main",
                      borderRadius: 2,
                      color: "white",
                    }}
                  >
                    <BoxIcon size={24} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      Plan Free
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Acceso básico a todas las funcionalidades
                    </Typography>
                    <Stack direction="row" spacing={3}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Precio:</strong> $0.00 / mes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Renovación:</strong> 30 de Diciembre de 2024
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ minWidth: 140 }}
                >
                  Cambiar Plan
                </Button>
                <Button variant="outlined" color="primary" size="large">
                  Ver Detalles
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" component="h1" gutterBottom>
                  Método de Pago
                </Typography>
                <Alert severity="info">Funcionalidad en desarrollo</Alert>
              </CardContent>
              <CardActions sx={{ p: 3 }}>
                <Button variant="outlined" color="error" size="large">
                  Cancelar Suscripción
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 12 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom>
              Historial de Facturación
            </Typography>
            <Alert severity="info">Funcionalidad en desarrollo</Alert>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
