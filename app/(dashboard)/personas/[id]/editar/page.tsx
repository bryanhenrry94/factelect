"use client";

import { useSession } from "next-auth/react";
import PageContainer from "@/components/container/PageContainer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { SlashIcon } from "lucide-react";
import PersonForm from "@/components/person/person-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";

export default function PersonNewPage() {
  const { data: session } = useSession();

  const params = useParams();
  const { id } = params;

  return (
    <PageContainer title="Nuevo Persona" description="Crear una nueva persona">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Inicio</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/personas">Personas</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Nuevo</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Editar Persona</CardTitle>
          <CardDescription>
            Actualiza la información de la persona.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonForm
            personId={id as string}
            tenantId={session?.user?.tenantId ?? ""}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
