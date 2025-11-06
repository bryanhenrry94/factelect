import { useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Menu,
  Button,
  IconButton,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const Profile = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [anchorEl2, setAnchorEl2] = useState(null);
  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleSignOut = async () => {
    await signOut({
      redirect: false,
    });
    router.push("/auth/signin");
    router.refresh();
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === "object" && {
            color: "primary.main",
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src="/images/profile/user-1.jpg"
          alt="image"
          sx={{
            width: 35,
            height: 35,
          }}
        />
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "300px",
          },
        }}
      >
        <MenuItem
          sx={{ flexDirection: "column", alignItems: "flex-start", py: 2 }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", mb: 1, width: "100%" }}
          >
            <Avatar
              src="/images/profile/user-1.jpg"
              alt="image"
              sx={{
                width: 40,
                height: 40,
                mr: 2,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {session?.user?.name || "Usuario"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {session?.user?.email || "email@example.com"}
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        <MenuItem
          onClick={() => router.push("/cuenta")}
          sx={{
            py: 1.8,
            px: 2.5,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          {/* Ícono con fondo sutil */}
          <Box
            sx={{
              backgroundColor: (theme) => theme.palette.primary.light,
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User width={20} height={20} color="#5D87FF" />
          </Box>

          {/* Texto */}
          <ListItemText
            primary={
              <Typography variant="body1" fontWeight={600}>
                Mi cuenta
              </Typography>
            }
            secondary={
              <Typography variant="body2" color="text.secondary">
                Configuración de perfil
              </Typography>
            }
          />
        </MenuItem>
        <Box mt={1} py={1} px={2}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleSignOut}
          >
            Cerrar sesión
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
