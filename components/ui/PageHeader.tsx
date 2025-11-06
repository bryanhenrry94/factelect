"use client";

import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  useTheme,
} from "@mui/material";
import { Home } from "lucide-react";
import Link from "next/link";

interface Route {
  name: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  routes?: Route[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  routes = [],
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        bgcolor: theme.palette.primary.light,
        borderRadius: 3,
        py: 3,
        px: 3,
        mb: 4,
      }}
    >
      <Box display="flex" flexDirection="column" gap={1}>
        <Typography variant="h5" fontWeight={600}>
          {title}
        </Typography>

        <Breadcrumbs aria-label="breadcrumb">
          <MuiLink
            component={Link}
            href="/"
            underline="hover"
            color="text.primary"
            sx={{ fontSize: 14 }}
          >
            Inicio
          </MuiLink>

          {routes.map((route) => (
            <MuiLink
              key={route.name}
              component={Link}
              href={route.href}
              underline="hover"
              color="text.primary"
              sx={{ fontSize: 14 }}
            >
              {route.name}
            </MuiLink>
          ))}

          <Typography color="text.secondary" sx={{ fontSize: 14 }}>
            {title}
          </Typography>
        </Breadcrumbs>
      </Box>
    </Box>
  );
};
