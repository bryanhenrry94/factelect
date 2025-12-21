"use client";

import Link from "next/link";
import Image from "next/image";
import logoAPP from "@/public/images/logos/app-logo.svg";

const Logo = () => {
  return (
    <Link
      href="/"
      aria-label="Ir al inicio"
      className="
        inline-flex items-center justify-center
        h-16 w-[180px]
        overflow-hidden
        transition-opacity duration-300 hover:opacity-85
        sm:h-[50px] sm:w-[140px]
      "
    >
      <Image
        src={logoAPP}
        alt="Logo de la aplicación"
        width={174}
        height={70}
        priority
        className="object-contain max-w-full h-auto"
      />
    </Link>
  );
};

export default Logo;
