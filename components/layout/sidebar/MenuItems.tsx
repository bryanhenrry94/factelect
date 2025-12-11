import {
  Files,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Wallet,
  ArrowLeftRight,
  ShoppingCart,
  PiggyBank,
  HandCoins,
  Book,
  CircleSmall,
  CreditCard,
  Building,
  Banknote,
  Receipt,
  BarChart3,
  Calculator,
  ScanBarcode,
} from "lucide-react";
import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "INICIO",
  },

  // Dashboard
  {
    id: uniqueId(),
    title: "Panel de Control",
    icon: LayoutDashboard,
    href: "/",
  },

  // Personas
  {
    id: uniqueId(),
    title: "Personas",
    icon: Users,
    children: [
      {
        id: uniqueId(),
        title: "Clientes",
        icon: CircleSmall,
        href: "/personas?tipo=cliente",
      },
      {
        id: uniqueId(),
        title: "Proveedores",
        icon: CircleSmall,
        href: "/personas?tipo=proveedor",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "POS",
    icon: ScanBarcode,
    children: [
      {
        id: uniqueId(),
        title: "Venta POS",
        icon: CircleSmall,
        href: "/pos",
      },
      {
        id: uniqueId(),
        title: "Apertura / Cierre de Caja",
        icon: CircleSmall,
        href: "/caja/apertura-cierre",
      },
      {
        id: uniqueId(),
        title: "Arqueo de Caja",
        icon: CircleSmall,
        href: "/caja/arqueo",
      },
    ],
  },
  // Ventas
  {
    id: uniqueId(),
    title: "Ventas",
    icon: PiggyBank,
    children: [
      {
        id: uniqueId(),
        title: "Ventas",
        icon: Receipt,
        href: "/documentos",
      },
      {
        id: uniqueId(),
        title: "Cobros",
        icon: Wallet,
        href: "/transacciones",
      },
      {
        id: uniqueId(),
        title: "Estado de Cuenta",
        icon: CircleSmall,
        href: "/estado-cuenta-clientes",
      },
      {
        id: uniqueId(),
        title: "Proformas",
        icon: CircleSmall,
        href: "/proformas",
      },
    ],
  },

  // Compras
  {
    id: uniqueId(),
    title: "Compras",
    icon: CreditCard,
    children: [
      {
        id: uniqueId(),
        title: "Compras",
        icon: ShoppingCart,
        href: "/compras",
      },
      {
        id: uniqueId(),
        title: "Pagos",
        icon: HandCoins,
        href: "/pagos",
      },
      {
        id: uniqueId(),
        title: "Estado de Cuenta",
        icon: CircleSmall,
        href: "/estado-cuenta-proveedores",
      },
      {
        id: uniqueId(),
        title: "Ordenes de Compra",
        icon: CircleSmall,
        href: "/ordenes-compra",
      },
    ],
  },

  // Bancos / Tesorería
  {
    id: uniqueId(),
    title: "Bancos",
    icon: Banknote,
    children: [
      {
        id: uniqueId(),
        title: "Cuentas Bancarias",
        icon: CircleSmall,
        href: "/bancos/cuentas",
      },
      {
        id: uniqueId(),
        title: "Movimientos Bancarios",
        icon: CircleSmall,
        href: "/bancos/movimientos",
      },
      // {
      //   id: uniqueId(),
      //   title: "Transferencias",
      //   icon: ArrowLeftRight,
      //   href: "/bancos/transferencias",
      // },
      {
        id: uniqueId(),
        title: "Conciliación Bancaria",
        icon: CircleSmall,
        href: "/bancos/conciliacion",
      },
    ],
  },

  // Caja chica
  {
    id: uniqueId(),
    title: "Caja",
    icon: Calculator,
    children: [
      {
        id: uniqueId(),
        title: "Caja",
        icon: CircleSmall,
        href: "/caja",
      },
      {
        id: uniqueId(),
        title: "Movimientos",
        icon: CircleSmall,
        href: "/caja/movimientos",
      },
    ],
  },

  // Inventario
  {
    id: uniqueId(),
    title: "Inventario",
    icon: Package,
    children: [
      {
        id: uniqueId(),
        title: "Productos / Servicios",
        icon: CircleSmall,
        href: "/inventario/productos",
      },
      {
        id: uniqueId(),
        title: "Categorías",
        icon: CircleSmall,
        href: "/inventario/categorias",
      },
      {
        id: uniqueId(),
        title: "Unidades de Medida",
        icon: CircleSmall,
        href: "/inventario/unidades",
      },
      {
        id: uniqueId(),
        title: "Bodegas",
        icon: CircleSmall,
        href: "/inventario/bodegas",
      },
      {
        id: uniqueId(),
        title: "Movimientos",
        icon: ArrowLeftRight,
        href: "/inventario/movimientos",
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
        href: "/facturas-electronicas",
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
      {
        id: uniqueId(),
        title: "Logs SRI",
        icon: CircleSmall,
        href: "/sri/logs",
      },
    ],
  },

  // Contabilidad
  {
    id: uniqueId(),
    title: "Contabilidad",
    icon: Book,
    children: [
      {
        id: uniqueId(),
        title: "Plan Contable",
        icon: CircleSmall,
        href: "/contabilidad/plan-contable",
      },
      {
        id: uniqueId(),
        title: "Centros de Costo",
        icon: CircleSmall,
        href: "/contabilidad/centros-costo",
      },
      {
        id: uniqueId(),
        title: "Asientos Contables",
        icon: CircleSmall,
        href: "/contabilidad/asientos-contables",
      },
    ],
  },

  // // Finanzas
  // {
  //   id: uniqueId(),
  //   title: "Finanzas",
  //   icon: Calculator,
  //   children: [
  //     {
  //       id: uniqueId(),
  //       title: "Flujo de Caja",
  //       icon: CircleSmall,
  //       href: "/finanzas/flujo-caja",
  //     },
  //     {
  //       id: uniqueId(),
  //       title: "Presupuestos",
  //       icon: CircleSmall,
  //       href: "/finanzas/presupuestos",
  //     },
  //     {
  //       id: uniqueId(),
  //       title: "Indicadores Financieros",
  //       icon: CircleSmall,
  //       href: "/finanzas/indicadores",
  //     },
  //   ],
  // },

  // Reportes
  {
    id: uniqueId(),
    title: "Reportes",
    icon: BarChart3,
    children: [
      {
        id: uniqueId(),
        title: "Movimientos de Cuenta",
        icon: CircleSmall,
        href: "/reportes/movimientos-cuenta",
      },
      {
        id: uniqueId(),
        title: "Balance General",
        icon: CircleSmall,
        href: "/reportes/balance-general",
      },
      {
        id: uniqueId(),
        title: "Estado de Resultado",
        icon: CircleSmall,
        href: "/reportes/estado-resultado",
      },
    ],
  },

  // Configuración
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
        title: "Perfil",
        icon: CircleSmall,
        href: "/perfil",
      },
      {
        id: uniqueId(),
        title: "Usuarios",
        icon: CircleSmall,
        href: "/usuarios",
      },
      {
        id: uniqueId(),
        title: "Establecimientos",
        icon: Building,
        href: "/establecimientos",
      },
    ],
  },
];

export default Menuitems;
