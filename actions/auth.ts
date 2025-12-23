"use server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import bcrypt from "bcrypt";
import { $Enums } from "@/prisma/generated/prisma";
import { cloneCOAForTenant } from "./accounting/clone-coa";
import { SignupData } from "@/lib/validations/auth/signup";

const resend = new Resend(process.env.RESEND_API_KEY);

type FormValues = {
  ruc: string;
  tenantName: string;
  tenantAddress: string;
  acceptTerms: boolean;
};

export const identifyTenantAction = async (
  email: string
): Promise<{ success: boolean; message?: string; subdomain?: string }> => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { include: { tenant: true } } },
  });

  if (!user || !user.memberships.length) {
    return { success: false, message: "Usuario o tenant no encontrado" };
  }

  return { success: true, subdomain: user.memberships[0].tenant.subdomain };
};

export async function sendPasswordResetEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Para seguridad, no revelamos si el correo existe o no
      return {
        success: true,
        message:
          "Si el correo existe, se enviará un enlace de restablecimiento.",
      };
    }

    // Aquí generarías un token temporal y lo guardarías en la base de datos
    const resetToken = Math.random().toString(36).substr(2); // Ejemplo simple, usar un método más seguro en producción
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hora de validez

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: tokenExpiry,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

    console.log("Reset link:", resetLink); // Para propósitos de depuración

    const { data, error } = await resend.emails.send({
      from:
        process.env.EMAIL_SENDER_NAME ||
        "Support <no-reply@centraalinning.com>",
      to: [email],
      subject: "Password Reset Request",
      html: `<p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>`,
      text: `Click the link below to reset your password:\n${resetLink}`,
    });

    console.log("Email send response:", data, error);

    if (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        message: "Error al enviar el correo de recuperación",
      };
    }

    return {
      success: true,
      message: "Si el correo existe, se enviará un enlace de restablecimiento.",
    };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return {
      success: false,
      message: "Error al enviar el correo de recuperación",
    };
  }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.expiresAt < new Date() ||
      !tokenRecord.user
    ) {
      throw new Error("Invalid or expired token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.deleteMany({
      where: { userId: tokenRecord.userId },
    });

    return { success: true, message: "Password has been reset successfully" };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, message: "Failed to reset password" };
  }
}

export const registerAccount = async (
  email: string,
  data: FormValues
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // ---------------------
    // VALIDACIONES
    // ---------------------
    const subdomainExists = await prisma.tenant.findFirst({
      where: { subdomain: data.ruc },
    });

    if (subdomainExists) {
      return {
        success: false,
        error: "Ya existe una empresa registrada con el mismo ruc",
      };
    }

    // ---------------------
    // TRANSACCIÓN PRINCIPAL
    // ---------------------
    const result = await prisma.$transaction(async (tx) => {
      // Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          ruc: data.ruc,
          name: data.tenantName,
          subdomain: data.ruc,
        },
      });

      // Configuración SRI
      await tx.sRIConfiguration.create({
        data: {
          tenantId: tenant.id,
          environment: "TEST",
        },
      });

      const user = await tx.user.findFirst({
        where: { email: email },
      });

      if (!user) {
        throw new Error("Usuario no encontrado durante la creación del tenant");
      }

      // Membership ADMIN
      await tx.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: "ADMIN",
        },
      });

      // Consumidor Final
      await tx.person.create({
        data: {
          personKind: "NATURAL",
          identificationType:
            $Enums.IdentificationType.VENTA_A_CONSUMIDOR_FINAL,
          identification: "9999999999",
          firstName: "CONSUMIDOR",
          lastName: "FINAL",
          email: "noemail@example.com",
          roles: ["CLIENT"],
          tenantId: tenant.id,
        },
      });

      // Establecimiento y punto de emisión
      const establishment = await tx.establishment.create({
        data: {
          code: "001",
          address: data.tenantAddress,
          tenantId: tenant.id,
        },
      });

      const emissionPoint = await tx.emissionPoint.create({
        data: {
          tenantId: tenant.id,
          establishmentId: establishment.id,
          code: "001",
        },
      });

      await tx.sequenceControl.create({
        data: {
          tenantId: tenant.id,
          documentType: $Enums.DocumentType.INVOICE,
          establishmentId: establishment.id,
          emissionPointId: emissionPoint.id,
          currentSequence: 1,
        },
      });

      await tx.warehouse.create({
        data: {
          name: "Almacén Principal",
          tenantId: tenant.id,
        },
      });

      // Categorías y unidades base
      await tx.category.create({
        data: {
          name: "General",
          tenantId: tenant.id,
        },
      });

      await tx.unit.create({
        data: {
          name: "Unidad",
          symbol: "UND",
          tenantId: tenant.id,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true },
      });

      // Retornar tenant al final
      return tenant;
    });

    // ---------------------
    // CREAR PLAN DE CUENTAS (fuera de la transacción principal)
    // ---------------------
    await cloneCOAForTenant(result.id);

    return {
      success: true,
      data: "Cuenta registrada exitosamente!",
    };
  } catch (error) {
    console.error(`Error al momento de crear la cuenta: ${error}`);
    return { success: false, error: "Error al crear la cuenta" };
  }
};

export const signup = async (
  data: SignupData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const emailExists = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (emailExists) {
      return {
        success: false,
        error: "Ya existe una cuenta registrada con el correo ingresado",
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error(`Error during signup: ${error}`);
    return { success: false, error: "Error al registrar el usuario" };
  }
};

export const getOnboardingStatus = async (
  email: string
): Promise<{
  success: boolean;
  onboardingCompleted?: boolean;
  error?: string;
}> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { onboardingCompleted: true },
    });

    console.log("Onboarding status user:", user);

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    return { success: true, onboardingCompleted: user.onboardingCompleted };
  } catch (error) {
    console.error(`Error fetching onboarding status: ${error}`);
    return {
      success: false,
      error: "Error al obtener el estado de onboarding",
    };
  }
};
