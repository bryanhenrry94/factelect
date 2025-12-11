"use client";

import * as React from "react";
import {
  AudioWaveform,
  CreditCard,
  PiggyBank,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Banknote,
  Calculator,
  Package,
  BookOpen,
  BarChart3,
  User,
  LayoutDashboard,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Personas",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Clientes",
          url: "personas?tipo=cliente",
        },
        {
          title: "Proveedores",
          url: "personas?tipo=proveedor",
        },
      ],
    },

    {
      title: "Ventas",
      url: "#",
      icon: PiggyBank,
      items: [
        {
          title: "Ventas",
          url: "/documentos",
        },
        {
          title: "Cobros",
          url: "/transacciones",
        },
        {
          title: "Estado de Cuenta",
          url: "/estado-cuenta-clientes",
        },
        {
          title: "Proformas",
          url: "/proformas",
        },
      ],
    },
    {
      title: "Compras",
      url: "#",
      icon: CreditCard,
      items: [
        {
          title: "Compras",
          url: "/documentos",
        },
        {
          title: "Pagos",
          url: "/transacciones",
        },
        {
          title: "Estado de Cuenta",
          url: "/estado-cuenta-proveedores",
        },
        {
          title: "Ordenes de Compra",
          url: "/ordenes-compra",
        },
      ],
    },
    {
      title: "Bancos",
      url: "#",
      icon: Banknote,
      items: [
        {
          title: "Cuentas Bancarias",
          url: "/bancos/cuentas",
        },
        {
          title: "Movimientos Bancarios",
          url: "/bancos/movimientos",
        },
        {
          title: "Conciliación Bancaria",
          url: "/bancos/conciliacion",
        },
      ],
    },
    {
      title: "Caja",
      url: "#",
      icon: Calculator,
      items: [
        {
          title: "Caja",
          url: "/caja",
        },
        {
          title: "Movimientos",
          url: "/caja/movimientos",
        },
      ],
    },
    {
      title: "Inventario",
      url: "#",
      icon: Package,
      items: [
        {
          title: "Productos / Servicios",
          url: "/inventario/productos",
        },
        {
          title: "Categorías",
          url: "/inventario/categorias",
        },
        {
          title: "Unidades de Medida",
          url: "/inventario/unidades",
        },
        {
          title: "Bodegas",
          url: "/inventario/bodegas",
        },
        {
          title: "Movimientos",
          url: "/inventario/movimientos",
        },
      ],
    },
    {
      title: "Facturación Electrónica",
      url: "#",
      icon: Package,
      items: [
        {
          title: "Facturas",
          url: "/facturacion-electronica/facturas",
        },
        {
          title: "Notas de Crédito",
          url: "/facturacion-electronica/notas-credito",
        },
        {
          title: "Notas de Débito",
          url: "/facturacion-electronica/notas-debito",
        },
        {
          title: "Guías de Remisión",
          url: "/facturacion-electronica/guias-remision",
        },
        {
          title: "Retenciones",
          url: "/facturacion-electronica/retenciones",
        },
      ],
    },
    {
      title: "Contabilidad",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Plan Contable",
          url: "/contabilidad/plan-contable",
        },
        {
          title: "Centros de Costo",
          url: "/contabilidad/centros-costo",
        },
        {
          title: "Asientos Contables",
          url: "/contabilidad/asientos-contables",
        },
      ],
    },
    {
      title: "Reportes",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Movimientos de Cuenta",
          url: "/reportes/movimientos-cuenta",
        },
        {
          title: "Balance General",
          url: "/reportes/balance-general",
        },
        {
          title: "Estado de Resultado",
          url: "/reportes/estado-resultado",
        },
      ],
    },
  ],
  projects: [
    {
      name: "General",
      url: "/configuracion/general",
      icon: Frame,
    },
    {
      name: "Perfil",
      url: "/configuracion/perfil",
      icon: PieChart,
    },
    {
      name: "Usuarios",
      url: "/configuracion/usuarios",
      icon: User,
    },
    {
      name: "Establecimientos",
      url: "/configuracion/establecimientos",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
