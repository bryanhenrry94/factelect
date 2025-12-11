"use client";

import Link from "next/link";
import Image from "next/image";
import logoAPP from "@/public/images/logos/app-logo.svg";

interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Ir al inicio"
      className={`
        flex items-center justify-center
        transition-all duration-300 ease-in-out
        overflow-hidden
        hover:opacity-85
        ${collapsed ? "w-8 h-8" : "w-44 h-16"}
      `}
    >
      {collapsed ? (
        // 🔹 Logo colapsado: solo inicial
        <div
          className="
            flex items-center justify-center
            w-7 h-7 rounded-sm
            bg-primary text-primary-foreground
            text-3xl font-extrabold
            transition-all duration-300
            shadow-md
          "
        >
          D
        </div>
      ) : (
        // 🔹 Logo expandido: logo completo
        <Image
          src={logoAPP}
          alt="Logo de la aplicación"
          width={174}
          height={70}
          priority
          className="object-contain max-w-full h-auto"
        />
      )}
    </Link>
  );
}
