import { prisma } from "@/lib/prisma";

export async function cloneCOAForTenant(tenantId: string) {
  console.log("📌 Clonando plan de cuentas para tenant:", tenantId);

  const template = await prisma.chartOfAccountTemplate.findMany();

  if (!template.length) {
    throw new Error("La plantilla del plan de cuentas está vacía.");
  }

  const idMap = new Map<string, string>(); // code → new id

  // 1. Crear todos sin jerarquía
  for (const acc of template) {
    const newAcc = await prisma.chartOfAccount.create({
      data: {
        tenantId,
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        parentId: null,
      },
    });

    idMap.set(acc.code, newAcc.id);
  }

  console.log("✔ Cuentas creadas, resolviendo jerarquía...");

  // 2. Actualizar parentId
  for (const acc of template) {
    if (!acc.parentCode) continue;

    await prisma.chartOfAccount.update({
      where: {
        id: idMap.get(acc.code)!,
      },
      data: {
        parentId: idMap.get(acc.parentCode)!,
      },
    });
  }

  console.log("🎉 Plan de cuentas clonado correctamente para el tenant.");
}
