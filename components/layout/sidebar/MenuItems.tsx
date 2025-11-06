import { Copy, LayoutDashboard, Package, Settings, Users } from "lucide-react";

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
    title: "Clientes",
    icon: Users,
    href: "/clientes",
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
