import {
  Banknote,
  Copy,
  LayoutDashboard,
  Package,
  Settings,
  Users,
} from "lucide-react";

import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "INICIO",
  },

  {
    id: uniqueId(),
    title: "Panel de Control",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    navlabel: true,
    subheader: "MANTENIMIENTO",
  },
  {
    id: uniqueId(),
    title: "Personas",
    icon: Users,
    href: "/personas",
  },
  {
    id: uniqueId(),
    title: "Productos",
    icon: Package,
    href: "/productos",
  },
  {
    navlabel: true,
    subheader: "TRANSACCIONES",
  },
  {
    id: uniqueId(),
    title: "Transacciones",
    icon: Banknote,
    href: "/transacciones",
  },
  {
    navlabel: true,
    subheader: "FACTURACIÓN ELECTRÓNICA",
  },
  {
    id: uniqueId(),
    title: "Facturas",
    icon: Copy,
    href: "/facturas",
  },
  {
    navlabel: true,
    subheader: "CONFIGURACIÓN",
  },
  {
    id: uniqueId(),
    title: "Configuración",
    icon: Settings,
    href: "/configuracion",
  },
  {
    id: uniqueId(),
    title: "Cuenta",
    icon: Settings,
    href: "/cuenta",
  },
];

export default Menuitems;
