"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, ShoppingBag } from "lucide-react";

import PageContainer from "@/components/container/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

import {
  Category,
  CreateCategory,
  CreateCategorySchema,
} from "@/lib/validations/inventory/category";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from "@/actions/inventory/category";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { PaginationControls } from "@/components/ui/pagination-controls";

const ROWS_PER_PAGE = 5;

export default function CategorysProductsPage() {
  const { data: session } = useSession();

  const tenantId = session?.user?.tenantId || "";

  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySelected, setCategorySelected] = useState<Category | null>(
    null
  );

  const { search, setSearch } = useSearchFilter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* ---------------- form ---------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategory>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: { name: "" },
  });

  /* ---------------- fetch ---------------- */
  const fetchCategories = async () => {
    if (!tenantId) return;

    const res = await getAllCategories(tenantId, search);
    if (!res.success) {
      notifyError("Error al cargar categorías");
      return;
    }
    setCategories(res.data || []);
  };

  useEffect(() => {
    fetchCategories();
  }, [tenantId, search]);

  /* ---------------- actions ---------------- */
  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    reset({ name: "" });
    setCategorySelected(null);
    setOpen(false);
  };

  const handleEdit = (category: Category) => {
    setCategorySelected(category);
    reset({ name: category.name });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await ConfirmDialog.confirm(
      "Eliminar categoría",
      "¿Deseas eliminar esta categoría?"
    );
    if (!confirm) return;

    const res = await deleteCategory(id);
    if (!res.success) {
      notifyError("Error al eliminar la categoría");
      return;
    }

    notifyInfo("Categoría eliminada");
    fetchCategories();
  };

  /* ---------------- submit ---------------- */
  const onSubmit = async (data: CreateCategory) => {
    if (!tenantId) {
      notifyError("Tenant no encontrado");
      return;
    }

    const res = categorySelected
      ? await updateCategory(categorySelected.id, data)
      : await createCategory(tenantId, data);

    if (!res.success) {
      notifyError("Error al guardar categoría");
      return;
    }

    notifyInfo(categorySelected ? "Categoría actualizada" : "Categoría creada");
    handleClose();
    fetchCategories();
  };

  return (
    <PageContainer
      title="Categorías de Productos"
      description="Gestiona las categorías de tus productos y servicios"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Input
          placeholder="Buscar categorías..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <Button onClick={handleOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {/* List */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mb-2" />
              <p>No hay categorías aún</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
                    .map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <Separator className="my-3" />

              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={categories.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {categorySelected ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <>
                  <Input
                    {...field}
                    placeholder="Nombre de la categoría"
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
