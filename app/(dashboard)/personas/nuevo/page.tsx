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
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function PersonNewPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSave = async () => {
    // Lógica después de guardar la nueva persona
  };

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

      <div className="mt-4">
        <Card>
          <CardContent>
            <PersonForm tenantId={session?.user?.tenantId ?? ""} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
