"use client";

import Link from "next/link";
import Image from "next/image";
import { styled } from "@mui/material";
import logoAPP from "@/public/images/logos/app-logo.svg";

const StyledLink = styled(Link)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 64,
  width: 180,
  overflow: "hidden",
  transition: "opacity 0.3s ease",
  "&:hover": {
    opacity: 0.85,
  },
  [theme.breakpoints.down("sm")]: {
    width: 140,
    height: 50,
  },
}));

const Logo = () => (
  <StyledLink href="/" aria-label="Ir al inicio">
    <Image
      src={logoAPP}
      alt="Logo de la aplicación"
      width={174}
      height={70}
      priority
      style={{
        objectFit: "contain",
        maxWidth: "100%",
        height: "auto",
      }}
    />
  </StyledLink>
);

export default Logo;
