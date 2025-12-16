"use client";

import { BoxIcon } from "lucide-react";

/* shadcn */
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const BillingForm = () => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Información de Facturación */}
      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Información de Facturación</h2>

          <Alert>
            <AlertDescription>Funcionalidad en desarrollo</AlertDescription>
          </Alert>

          <Input
            readOnly
            value="Dazzsoft S.A.C"
            placeholder="Nombre de la Empresa"
          />

          <Input readOnly value="20612345678" placeholder="RUC" />

          <Input
            readOnly
            value="Av. Siempre Viva 123, Lima, Perú"
            placeholder="Dirección"
          />

          <Input
            readOnly
            value="info@dazzsoft.com"
            placeholder="Correo Electrónico"
          />
        </CardContent>

        <CardFooter className="justify-end">
          <Button size="lg">Guardar</Button>
        </CardFooter>
      </Card>

      {/* Plan y Método de Pago */}
      <div className="space-y-6">
        {/* Plan Actual */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Plan Actual</h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona tu plan de suscripción
                </p>

                <Alert className="mt-2">
                  <AlertDescription>
                    Funcionalidad en desarrollo
                  </AlertDescription>
                </Alert>
              </div>

              <Badge variant="outline">Activo</Badge>
            </div>

            <Separator />

            <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BoxIcon className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">Plan Free</h3>
                <p className="text-sm text-muted-foreground">
                  Acceso básico a todas las funcionalidades
                </p>

                <div className="mt-2 flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <span>
                    <strong>Precio:</strong> $0.00 / mes
                  </span>
                  <span>
                    <strong>Renovación:</strong> 30 de Diciembre de 2024
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="gap-3">
            <Button size="lg">Cambiar Plan</Button>
            <Button size="lg" variant="outline">
              Ver Detalles
            </Button>
          </CardFooter>
        </Card>

        {/* Método de Pago */}
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-xl font-semibold">Método de Pago</h2>

            <Alert>
              <AlertDescription>Funcionalidad en desarrollo</AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter>
            <Button variant="destructive" size="lg">
              Cancelar Suscripción
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Historial de Facturación */}
      <Card className="md:col-span-2">
        <CardContent className="space-y-3">
          <h2 className="text-xl font-semibold">Historial de Facturación</h2>

          <Alert>
            <AlertDescription>Funcionalidad en desarrollo</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
