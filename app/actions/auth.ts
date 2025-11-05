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

    const resetLink = `${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/auth/reset-password?token=${resetToken}`;

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
