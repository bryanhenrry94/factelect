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
