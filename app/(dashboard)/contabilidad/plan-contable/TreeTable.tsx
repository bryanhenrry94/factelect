"use client";

import { useState, useMemo, Fragment } from "react";
import { ChartOfAccount } from "@/lib/validations";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";

import {
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Plus,
  EllipsisVertical,
} from "lucide-react";

interface TreeTableProps {
  accounts: ChartOfAccount[];
  onCreate?: (parentId: string | null) => void;
  onEdit?: (account: ChartOfAccount) => void;
  onDelete?: (account: ChartOfAccount) => void;
}

interface TreeNode extends ChartOfAccount {
  children?: TreeNode[];
}

export function TreeTable({
  accounts,
  onCreate,
  onEdit,
  onDelete,
}: TreeTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  // -------------------------
  // Construir árbol
  // -------------------------
  const buildTree = (list: ChartOfAccount[]): TreeNode[] => {
    const map: Record<string, TreeNode> = {};
    const roots: TreeNode[] = [];

    list.forEach((acc) => (map[acc.id] = { ...acc, children: [] }));

    list.forEach((acc) => {
      if (acc.parentId && map[acc.parentId]) {
        map[acc.parentId].children!.push(map[acc.id]);
      } else {
        roots.push(map[acc.id]);
      }
    });

    return roots;
  };

  // -------------------------
  // Filtros
  // -------------------------
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.code.toLowerCase().includes(search.toLowerCase()) ||
        acc.name.toLowerCase().includes(search.toLowerCase());

      const matchesType = filterType ? acc.accountType === filterType : true;

      return matchesSearch && matchesType;
    });
  }, [accounts, search, filterType]);

  const tree = buildTree(filteredAccounts);

  // -------------------------
  // Expandir / Contraer
  // -------------------------
  const expandAll = () => {
    const all: Record<string, boolean> = {};
    accounts.forEach((acc) => (all[acc.id] = true));
    setExpanded(all);
  };

  const collapseAll = () => setExpanded({});

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // -------------------------
  // Render recursivo
  // -------------------------
  const renderNode = (node: TreeNode, level = 0) => {
    const isOpen = expanded[node.id];
    const hasChildren = !!node.children?.length;

    return (
      <Fragment key={node.id}>
        <TableRow>
          <TableCell className="w-10">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggle(node.id)}
              >
                {isOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
          </TableCell>

          <TableCell>
            <div
              className="font-mono"
              style={{ paddingLeft: `${level * 16}px` }}
            >
              {node.code}
            </div>
          </TableCell>

          <TableCell>{node.name}</TableCell>

          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <EllipsisVertical size={16} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onCreate?.(node.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onEdit?.(node)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete?.(node)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>

        {isOpen && node.children?.map((child) => renderNode(child, level + 1))}
      </Fragment>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan de Cuentas</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Buscar por código o nombre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />

          <Select
            value={filterType}
            onValueChange={(value) =>
              setFilterType(value === "ALL" ? undefined : value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo de cuenta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="ASSET">Activo</SelectItem>
              <SelectItem value="LIABILITY">Pasivo</SelectItem>
              <SelectItem value="EQUITY">Patrimonio</SelectItem>
              <SelectItem value="INCOME">Ingreso</SelectItem>
              <SelectItem value="EXPENSE">Gasto</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={expandAll}>
            Expandir todo
          </Button>

          <Button variant="outline" onClick={collapseAll}>
            Contraer todo
          </Button>

          <Button onClick={() => onCreate?.(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Cuenta raíz
          </Button>
        </div>

        <Separator />

        {/* Tabla */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>{tree.map((node) => renderNode(node))}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
