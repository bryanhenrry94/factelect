"use client";

import * as React from "react";
import {
  AudioWaveform,
  CreditCard,
  PiggyBank,
  Command,
  GalleryVerticalEnd,
  Map,
  PieChart,
  SquareTerminal,
  Banknote,
  Calculator,
  Package,
  BookOpen,
  BarChart3,
  User,
  Building,
  Settings,
} from "lucide-react";

import { NavMain } from "@/components/layout/sidebar/nav-main";
import { NavProjects } from "@/components/layout/sidebar/nav-projects";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { useSession } from "next-auth/react";

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
      // isActive: true,
      items: [
        {
          title: "Clientes",
          url: "/personas?tipo=cliente",
        },
        {
          title: "Proveedores",
          url: "/personas?tipo=proveedor",
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
          url: "/documentos?type=CUSTOMER&documentType=INVOICE",
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
          url: "/documentos?type=SUPPLIER&documentType=INVOICE",
        },
        {
          title: "Ordenes de Compra",
          url: "/ordenes-compra",
        },
      ],
    },
    {
      title: "Transacciones",
      url: "/transacciones",
      icon: CreditCard,
      items: [
        { title: "Documentos", url: "/documentos" },
        { title: "Todas las Transacciones", url: "/transacciones" },
        { title: "Cobros", url: "/transacciones?tipo=cobro" },
        { title: "Pagos", url: "/transacciones?tipo=pago" },
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
          title: "Almacenes",
          url: "/inventario/almacenes",
        },
        {
          title: "Movimientos",
          url: "/inventario/movimientos",
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
      name: "Empresa",
      url: "/configuracion/empresa",
      icon: Building,
    },
    {
      name: "Facturación Electrónica",
      url: "/configuracion/facturacion-electronica",
      icon: Settings,
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
  const { state } = useSidebar();
  const { data: session } = useSession();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Logo collapsed={state === "collapsed"} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: session?.user?.name || "",
            email: session?.user?.email || "",
            avatar: session?.user?.image || "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
