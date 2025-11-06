"use client";
import { updateUserProfile } from "@/app/actions/user";
import PageContainer from "@/components/container/PageContainer";
import ChangePasswordForm from "@/components/setting/change-password-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { AlertService } from "@/lib/alerts";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  Divider,
  Chip,
  Tabs,
  Tab,
  Stack,
  IconButton,
  CardActions,
  Alert,
} from "@mui/material";
import { BoxIcon, CreditCard, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfilePage = () => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string }>({
    name: session?.user?.name || "",
  });

  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    setUserInfo({ name: session?.user?.name || "" });
  }, [session]);

  const handleInputChange = (field: string, value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Here you would typically save to your backend
    const result = await updateUserProfile(
      session?.user?.id || "",
      userInfo.name
    );
    if (result.success) {
      AlertService.showSuccess("Perfil actualizado correctamente");
    } else {
      AlertService.showError(result.error || "Error al actualizar el perfil");
    }
    setIsEditing(false);
  };

  return (
    <PageContainer title="Cuenta" description="Gestión de la cuenta">
      {/* Header */}
      <PageHeader title="Cuenta" />

      {/* Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<User className="w-5 h-5" />}
              iconPosition="start"
              label="Cuenta"
            />
            <Tab
              icon={<CreditCard className="w-5 h-5" />}
              iconPosition="start"
              label="Facturación"
            />
          </Tabs>
        </Box>

        {/* Company Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Profile Card */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" component="h1" gutterBottom>
                      Actualizar Perfil
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cambia tu foto de perfil desde aquí.
                    </Typography>
                  </Box>
                  <Avatar
                    src={session?.user?.image || "/images/profile/user-1.jpg"}
                    sx={{
                      width: 120,
                      height: 120,
                      mx: "auto",
                      mb: 2,
                      fontSize: "3rem",
                    }}
                  >
                    {session?.user?.name?.charAt(0)}
                  </Avatar>
                  <Stack spacing={2} direction={"row"}>
                    <Button variant="contained" component="label" fullWidth>
                      Subir Foto
                      <input hidden accept="image/*" type="file" />
                    </Button>
                    <Button variant="outlined" color="error" fullWidth disabled>
                      Eliminar
                    </Button>
                  </Stack>
                  <Alert severity="info">Funcionalidad en desarrollo</Alert>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ mt: 1 }}
                  >
                    Formatos permitidos: JPG, PNG. Tamaño máximo 2MB.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <ChangePasswordForm userId={session?.user?.id || ""} />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" component="h1" gutterBottom>
                      Información Personal
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Actualiza tu información personal aquí.
                    </Typography>
                  </Box>
                  <Box
                    component="form"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <TextField
                      label="Nombre"
                      value={userInfo.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      InputProps={{
                        readOnly: !isEditing,
                      }}
                      fullWidth
                    />
                    <Box sx={{ mt: 2 }}>
                      {isEditing ? (
                        <>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSave}
                            sx={{ mr: 2 }}
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() => setIsEditing(true)}
                        >
                          Editar Perfil
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
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
                          <Alert severity="info">
                            Funcionalidad en desarrollo
                          </Alert>
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
                              <strong>Renovación:</strong> 30 de Diciembre de
                              2024
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
        </TabPanel>
      </Card>
    </PageContainer>
  );
};

export default ProfilePage;
