"use client";
import { updateUserProfile } from "@/app/actions/user";
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
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const ProfilePage = () => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string }>({
    name: session?.user?.name || "",
  });

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
    <Container maxWidth="xl">
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Perfil
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona la información de tu perfil
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Avatar
                src={session?.user?.image || ""}
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

              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}
              >
                {isEditing ? (
                  <>
                    <TextField
                      fullWidth
                      label="Nombre"
                      value={userInfo.name ?? ""}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      disabled={!isEditing}
                      variant={isEditing ? "outlined" : "standard"}
                      helperText={
                        "Los cambios se guardarán inmediatamente. Para ver la actualización completa, cierra sesión e inicia sesión nuevamente."
                      }
                    />
                  </>
                ) : (
                  <Typography variant="h6" gutterBottom>
                    {session?.user?.name || "Usuario"}
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary">
                  {session?.user?.email || "Usuario"}
                </Typography>

                <Button
                  variant={isEditing ? "contained" : "outlined"}
                  onClick={() =>
                    isEditing ? handleSave() : setIsEditing(true)
                  }
                  sx={{ mt: 2 }}
                >
                  {isEditing ? "Guardar" : "Editar Perfil"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
