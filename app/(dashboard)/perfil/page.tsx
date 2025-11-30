"use client";
import { updateUserProfile } from "@/actions/user";
import PageContainer from "@/components/container/PageContainer";
import ChangePasswordForm from "@/components/setting/change-password-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { notifyError, notifyInfo } from "@/lib/notifications";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  Stack,
  Alert,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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
      notifyInfo("Perfil actualizado correctamente");
    } else {
      notifyError(result.error || "Error al actualizar el perfil");
    }
    setIsEditing(false);
  };

  return (
    <PageContainer title="Perfil" description="Gestión de perfil de usuario">
      {/* Header */}
      <PageHeader title="Perfil" />

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
                  onChange={(e) => handleInputChange("name", e.target.value)}
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
    </PageContainer>
  );
};

export default ProfilePage;
