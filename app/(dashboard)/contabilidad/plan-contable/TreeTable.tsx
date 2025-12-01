"use client";

import { useState, useMemo, Fragment } from "react";
import { Account } from "@/lib/validations";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem,
  Menu,
} from "@mui/material";

import {
  ChevronRight,
  ChevronDown,
  Delete,
  Edit,
  Plus,
  EllipsisVertical,
} from "lucide-react";

interface TreeTableProps {
  accounts: Account[];
  onCreate?: (parentId: string | null) => void;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
}

interface TreeNode extends Account {
  children?: TreeNode[];
}

export const TreeTable: React.FC<TreeTableProps> = ({
  accounts,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const open = Boolean(anchorEl);

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    node: TreeNode
  ) => {
    setSelectedNode(node); // GUARDAMOS EL REGISTRO REAL
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedNode(null);
  };

  // -------------------------
  // Convertir lista plana → árbol
  // -------------------------
  const buildTree = (list: Account[]): TreeNode[] => {
    const map: Record<string, TreeNode> = {};
    const roots: TreeNode[] = [];

    list.forEach((acc) => {
      map[acc.id] = { ...acc, children: [] };
    });

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
  // Filtros + búsqueda
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
  // Expandir / contraer todo
  // -------------------------
  const expandAll = () => {
    const all: Record<string, boolean> = {};
    accounts.forEach((acc) => (all[acc.id] = true));
    setExpanded(all);
  };

  const collapseAll = () => {
    setExpanded({});
  };

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // -------------------------
  // Render recursivo
  // -------------------------
  const renderNode = (node: TreeNode, level: number = 0) => {
    if (!node) return null;

    const isOpen = expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <Fragment key={node.id}>
        <TableRow hover>
          {/* Expandir/Contraer */}
          <TableCell width={50}>
            {hasChildren ? (
              <IconButton size="small" onClick={() => toggle(node.id)}>
                {isOpen ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </IconButton>
            ) : (
              <Box width={24} />
            )}
          </TableCell>

          {/* Código con indentación */}
          <TableCell>
            <Box ml={level * 2}>
              <Typography fontFamily="monospace">{node.code}</Typography>
            </Box>
          </TableCell>

          {/* Nombre */}
          <TableCell>{node.name}</TableCell>

          {/* Tipo */}
          {/* <TableCell>{node.accountType || ""}</TableCell> */}

          {/* Acciones */}
          <TableCell>
            <IconButton
              size="small"
              onClick={(e) => handleOpenMenu(e, node)}
              title="Más opciones"
            >
              <EllipsisVertical size={16} />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              PaperProps={{
                elevation: 3,
                sx: { mt: 1, minWidth: 180, py: 0.5 },
              }}
            >
              <MenuItem
                onClick={() => {
                  if (selectedNode) onCreate?.(selectedNode.id);
                  handleClose();
                }}
                sx={{ minHeight: 40 }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Plus size={18} color="gray" />
                  <span>Agregar</span>
                </Box>
              </MenuItem>

              <MenuItem
                onClick={() => {
                  if (selectedNode) onEdit?.(selectedNode);
                  handleClose();
                }}
                sx={{ minHeight: 40 }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Edit size={18} color="gray" />
                  <span>Modificar</span>
                </Box>
              </MenuItem>

              <MenuItem
                onClick={() => {
                  if (selectedNode) onDelete?.(selectedNode);
                  handleClose();
                }}
                sx={{ minHeight: 40 }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Delete size={18} color="gray" />
                  <span>Eliminar</span>
                </Box>
              </MenuItem>
            </Menu>
          </TableCell>
        </TableRow>

        {/* Render hijos */}
        {isOpen && node.children?.map((child) => renderNode(child, level + 1))}
      </Fragment>
    );
  };

  return (
    <Paper elevation={2} sx={{ padding: 2 }}>
      <Typography variant="h6" mb={2}>
        Plan de Cuentas
      </Typography>

      {/* ===================== */}
      {/* Controles superiores */}
      {/* ===================== */}
      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="Buscar"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <TextField
          label="Filtrar por tipo"
          select
          size="small"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          sx={{ width: 200 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="ASSET">Activo</MenuItem>
          <MenuItem value="LIABILITY">Pasivo</MenuItem>
          <MenuItem value="EQUITY">Patrimonio</MenuItem>
          <MenuItem value="INCOME">Ingreso</MenuItem>
          <MenuItem value="EXPENSE">Gasto</MenuItem>
        </TextField>

        <Button variant="contained" onClick={expandAll}>
          Expandir todo
        </Button>

        <Button variant="outlined" onClick={collapseAll}>
          Contraer todo
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={() => onCreate?.(null)}
        >
          Crear cuenta raíz
        </Button>
      </Stack>

      {/* ===================== */}
      {/* Tabla */}
      {/* ===================== */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Código</TableCell>
            <TableCell>Nombre</TableCell>
            {/* <TableCell>Tipo</TableCell> */}
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>{tree.map((n) => renderNode(n))}</TableBody>
      </Table>
    </Paper>
  );
};
