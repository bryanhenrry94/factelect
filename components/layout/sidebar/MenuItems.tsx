import {
  Files,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Wallet,
  ArrowLeftRight,
  ShoppingCart,
  FileText,
  HandCoins,
  Book,
  CircleSmall,
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
    id: uniqueId(),
    title: "Personas",
    icon: Users,
    href: "/personas",
  },
  {
    id: uniqueId(),
    title: "Transacciones",
    icon: ArrowLeftRight,
    children: [
      {
        id: uniqueId(),
        title: "Compra / Venta",
        icon: ShoppingCart,
        href: "/documentos",
      },
      {
        id: uniqueId(),
        title: "Cobros / Pagos",
        icon: HandCoins,
        href: "/transacciones",
      },
      {
        id: uniqueId(),
        title: "Movimientos",
        icon: Wallet,
        href: "/movimientos",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Inventario",
    icon: Package,
    children: [
      {
        id: uniqueId(),
        title: "Productos / Servicios",
        icon: Package,
        href: "/productos",
      },
      {
        id: uniqueId(),
        title: "Entradas / Salidas",
        icon: ArrowLeftRight,
        href: "/inventario",
      },
      {
        id: uniqueId(),
        title: "Ajustes de Inventario",
        icon: CircleSmall,
        href: "/ajustes-inventario",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Facturación Electrónica",
    icon: Files,
    children: [
      {
        id: uniqueId(),
        title: "Facturas",
        icon: CircleSmall,
        href: "/facturas",
      },
      {
        id: uniqueId(),
        title: "Notas de Crédito",
        icon: CircleSmall,
        href: "/notas-credito",
      },
      {
        id: uniqueId(),
        title: "Notas de Débito",
        icon: CircleSmall,
        href: "/notas-debito",
      },
      {
        id: uniqueId(),
        title: "Guías de Remisión",
        icon: CircleSmall,
        href: "/guias-remision",
      },
      {
        id: uniqueId(),
        title: "Retenciones",
        icon: CircleSmall,
        href: "/retenciones",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Contabilidad",
    icon: Book,
    children: [
      {
        id: uniqueId(),
        title: "Plan Contable",
        icon: CircleSmall,
        href: "/plan-contable",
      },
      {
        id: uniqueId(),
        title: "Asientos Contables",
        icon: CircleSmall,
        href: "/asientos-contables",
      },
      {
        id: uniqueId(),
        title: "Reportes",
        icon: CircleSmall,
        href: "/reportes",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Configuración",
    icon: Settings,
    children: [
      {
        id: uniqueId(),
        title: "General",
        icon: CircleSmall,
        href: "/configuracion",
      },
      {
        id: uniqueId(),
        title: "Cuenta",
        icon: CircleSmall,
        href: "/cuenta",
      },
    ],
  },
];

export default Menuitems;
