"use server";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcrypt";

export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isCurrentPasswordValid = await compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Hash the new password and update it in the database
    const password_hash = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: password_hash,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error changing user password:", error);
    return { success: false, error: "Error changing user password" };
  }
};

export const updateUserProfile = async (
  userId: string,
  name: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Error updating user profile" };
  }
};

export const userExists = async (email: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return !!user;
};

export const getUsers = async (
  tenantId: string
): Promise<{ success: boolean; users?: any[]; error?: string }> => {
  try {
    console.log("Fetching users for tenant:", tenantId);

    const memberships = await prisma.membership.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
          },
        },
      },
    });

    console.log("Memberships found:", memberships.length);

    const users = memberships.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.role,
      active: membership.user.active,
    }));

    return { success: true, users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Error fetching users" };
  }
};

export const changeActiveStatus = async (
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const isUserAdmin = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (isUserAdmin?.isAdmin) {
      return {
        success: false,
        error: "No se puede cambiar el estado de un usuario administrador",
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        active: isActive,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error changing active status:", error);
    return { success: false, error: "Error changing active status" };
  }
};
