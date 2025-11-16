"use server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import bcrypt from "bcrypt";

const resend = new Resend(process.env.RESEND_API_KEY);

export const identifyTenantAction = async (
  email: string
): Promise<{ success: boolean; message?: string; subdomain?: string }> => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });

  if (!user || !user.tenant) {
    return { success: false, message: "Usuario o tenant no encontrado" };
  }

  return { success: true, subdomain: user.tenant.subdomain };
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

type FormValues = {
  name: string;
  email: string;
  password: string;
  ruc: string;
  tenantName: string;
  tenantAddress: string;
  acceptTerms: boolean;
};

export const registerAccount = async (
  data: FormValues
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    const emailExists = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (emailExists) {
      return {
        success: false,
        error: "Ya existe una cuenta registrada con el correo ingresado",
      };
    }

    const subdomainExists = await prisma.tenant.findFirst({
      where: {
        subdomain: data.ruc,
      },
    });

    if (subdomainExists) {
      return {
        success: false,
        error: "Ya existe una empresa registrada con el mismo ruc",
      };
    }

    const tenant = await prisma.tenant.create({
      data: {
        ruc: data.ruc,
        name: data.tenantName,
        subdomain: data.ruc,
      },
    });

    if (!tenant) {
      return { success: false, error: "Hubo un error al registrar la empresa" };
    }

    const sriConfig = await prisma.sRIConfiguration.create({
      data: {
        tenantId: tenant.id,
        sriEnvironment: "1",
      },
    });

    if (!sriConfig) {
      return { success: false, error: "Hubo un error al configurar el SRI" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        tenantId: tenant.id,
      },
    });

    if (!newUser) {
      return {
        success: false,
        error: "Hubo un error al registrar la cuenta del usuario",
      };
    }

    const account = await prisma.account.create({
      data: {
        tenantId: tenant.id,
        name: "Caja Principal",
        type: "CASH",
        currency: "USD",
        balance: 0,
      },
    });

    if (!account) {
      return {
        success: false,
        error: "Hubo un error al crear la cuenta principal",
      };
    }

    return { success: true, data: "Cuenta registrada exitosamente!" };
  } catch (error) {
    console.error(`Error al momento de crear la cuenta: ${error}`);
    return { success: false, error: "Error al crear la cuenta" };
  }
};
