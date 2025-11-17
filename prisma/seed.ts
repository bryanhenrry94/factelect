import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

async function main() {
  // 🔹 Crear tenant base (ejemplo)
  await prisma.tenant.upsert({
    where: { id: "0874303e-6795-46ef-8416-5d76bba8071b" },
    update: {},
    create: {
      id: "0874303e-6795-46ef-8416-5d76bba8071b",
      name: "BRYAN HENRRY NAVARRETE ZUÑIGA",
      subdomain: "0940528128001",
      legalName: "BRYAN HENRRY NAVARRETE ZUÑIGA",
      ruc: "0940528128001",
      phone: "+593969437708",
      contactEmail: "bryanhenrry94@gmail.com",
      address: "Guayaquil - Ecuador",
      logoUrl: null,
      obligatedAccounting: false,
    },
  });

  await prisma.sRIConfiguration.upsert({
    where: { tenantId: "0874303e-6795-46ef-8416-5d76bba8071b" },
    update: {},
    create: {
      tenantId: "0874303e-6795-46ef-8416-5d76bba8071b",
      environment: "TEST",
      certificatePath: "",
      certificatePassword: "",
    },
  });

  const password_hash = await hash("demo1234", 10);

  await prisma.user.upsert({
    where: { id: "28112419-5c53-47c5-b109-a29d02c1bb5d" },
    update: {},
    create: {
      id: "28112419-5c53-47c5-b109-a29d02c1bb5d",
      email: "bryanhenrry94@gmail.com",
      name: "Bryan Navarrete",
      password: password_hash,
      tenantId: "0874303e-6795-46ef-8416-5d76bba8071b",
    },
  });

  console.log("✅ Seed ejecutado correctamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
