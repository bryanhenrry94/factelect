"use server";
import { prisma } from "@/lib/prisma";
import { TenantInvitation } from "@/lib/validations/tenant-invitation";
import bcrypt from "bcrypt";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const inviteUser = async (
  tenantId: string,
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const token = Math.random().toString(36).substr(2);

    // Aquí puedes agregar la lógica para crear una invitación en la base de datos
    await prisma.tenantInvitation.create({
      data: {
        tenantId,
        email,
        token, // Genera un token simple, usa un método más seguro en producción
      },
    });

    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invitation?token=${token}`;

    // Aquí puedes agregar la lógica para enviar el correo electrónico de invitación
    await resend.emails.send({
      from:
        process.env.EMAIL_SENDER_NAME ||
        "Soporte <no-reply@centraalinning.com>",
      to: [email],
      subject: "Invitación para unirse a nuestra plataforma",
      html: `<p>Haz clic en el siguiente enlace para aceptar la invitación:</p>
        <a href="${invitationLink}">Aceptar invitación</a>`,
      text: `Haz clic en el siguiente enlace para aceptar la invitación:\n${invitationLink}`,
    });

    return { success: true };
  } catch (error) {
    console.error("Error inviting user:", error);
    return { success: false, error: "Error inviting user" };
  }
};

export const acceptInvitation = async (
  token: string,
  name: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const invitation = await prisma.tenantInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return { success: false, error: "Invalid invitation token" };
    }

    const password_hash = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    // si el email ya existe, solo crear la membresía
    if (existingUser) {
      await prisma.membership.create({
        data: {
          userId: existingUser.id,
          tenantId: invitation.tenantId,
          role: "USER",
        },
      });
    } else {
      const newUser = await prisma.user.create({
        data: {
          email: invitation.email,
          name,
          password: password_hash,
          onboardingCompleted: true,
          active: true,
          isAdmin: false,
        },
      });

      await prisma.membership.create({
        data: {
          userId: newUser.id,
          tenantId: invitation.tenantId,
          role: "USER",
        },
      });
    }

    await prisma.tenantInvitation.delete({
      where: { id: invitation.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return { success: false, error: "Error accepting invitation" };
  }
};

export const validateToken = async (
  token: string
): Promise<{ valid: boolean; email?: string }> => {
  try {
    const invitation = await prisma.tenantInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return { valid: false };
    }

    return { valid: true, email: invitation.email };
  } catch (error) {
    console.error("Error validating invitation token:", error);
    return { valid: false };
  }
};

export const getInvitationsByTenant = async (
  tenantId: string
): Promise<{
  success: boolean;
  invitations?: TenantInvitation[];
  error?: string;
}> => {
  try {
    const invitations = await prisma.tenantInvitation.findMany({
      where: { tenantId },
    });

    return { success: true, invitations };
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return { success: false, error: "Error fetching invitations" };
  }
};

export const deleteInvitation = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.tenantInvitation.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting invitation:", error);

    return {
      success: false,
      error: "No se pudo eliminar la invitación",
    };
  }
};
