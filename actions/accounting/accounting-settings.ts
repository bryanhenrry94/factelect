"use server";

import { prisma } from "@/lib/prisma";
import { AccountingKey } from "@/components/accounting/accounting-setting-form";

type SettingInput = {
  key: AccountingKey;
  accountId?: string | null;
};

export async function saveAccountingSettings(
  tenantId: string,
  settings: SettingInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(
      settings.map((s) =>
        prisma.accountingSetting.upsert({
          where: {
            tenantId_key: {
              tenantId,
              key: s.key,
            },
          },
          create: {
            tenantId,
            key: s.key,
            accountId: s.accountId || null,
          },
          update: {
            accountId: s.accountId || null,
          },
        })
      )
    );

    return { success: true };
  } catch (error) {
    console.error("saveAccountingSettings error:", error);
    return { success: false, error: "No se pudo guardar la configuración" };
  }
}

export async function getAccountingSettings(
  tenantId: string
): Promise<{ success: boolean; data?: SettingInput[]; error?: string }> {
  try {
    const settings = await prisma.accountingSetting.findMany({
      where: { tenantId },
    });

    const data: SettingInput[] = settings.map((s) => ({
      key: s.key as AccountingKey,
      accountId: s.accountId || undefined,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("getAccountingSettingsByTenantId error:", error);
    return {
      success: false,
      error: "No se pudo obtener la configuración contable",
    };
  }
}
