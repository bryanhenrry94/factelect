"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Edit, Trash2, PackageSearch } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";

import { deleteProduct, getAllProducts } from "@/actions/inventory/product";
import { Product } from "@/lib/validations/inventory/product";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Unit } from "@/lib/validations/unit";
import { getUnits } from "@/actions/unit";

export default function ProductsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const { search, setSearch } = useSearchFilter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* 🔄 Load */
  const loadProducts = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const res = await getAllProducts(tenantId, search);
      if (res.success) setProducts(res.data || []);
      else notifyError(res.error || "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }, [tenantId, search]);

  const loadUnits = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const res = await getUnits(tenantId);
      if (res.success) setUnits(res.data || []);
      else notifyError(res.error || "Error cargando unidades");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadProducts();
    loadUnits();
  }, [loadProducts, loadUnits]);

  /* ❌ Delete */
  const handleDelete = async (id: string) => {
    const confirmed = await ConfirmDialog.confirm(
      "Eliminar producto",
      "Esta acción no se puede deshacer"
    );

    if (!confirmed) return;

    const res = await deleteProduct(id);
    if (!res.success) return notifyError(res.error || "Error al eliminar");

    notifyInfo("Producto eliminado");
    loadProducts();
  };

  const handleNew = () => {
    router.push("/inventario/productos/nuevo");
  };

  const handleEdit = (product: Product) => {
    router.push(`/inventario/productos/${product.id}/editar`);
  };

  return (
    <PageContainer
      title="Productos"
      description="Gestiona tus productos y servicios"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <Button onClick={handleNew} className="gap-2">
          <Plus size={16} /> Nuevo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Cargando productos...
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
              <PackageSearch size={40} />
              <p className="font-medium">No hay productos</p>
              <p className="text-sm">
                Empieza creando tu primer producto o servicio
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {products
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
                    .map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.code}</TableCell>
                        <TableCell>{p.description}</TableCell>
                        <TableCell>
                          {units.find((u) => u.id === p.unitId)?.name || ""}
                        </TableCell>
                        <TableCell className="text-right">
                          ${p.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              p.status === "ACTIVE" ? "default" : "destructive"
                            }
                          >
                            {p.status === "ACTIVE" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleEdit(p);
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={products.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
