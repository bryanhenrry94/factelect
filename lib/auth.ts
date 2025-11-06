// lib/auth.ts
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

// Extend NextAuth types to include custom properties
declare module "next-auth" {
  interface User {
    id: string;
    tenantId: string;
    tenantName: string;
    tenantSubdomain: string;
  }
  interface Session {
    user?: User;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        subdomain: { label: "Subdomain", type: "text" },
      },
      async authorize(credentials, req) {
        console.log("Credentials received:", credentials);

        if (
          !credentials?.email ||
          !credentials?.password ||
          !credentials?.subdomain
        )
          return null;

        const tenant = await prisma.tenant.findUnique({
          where: { subdomain: credentials.subdomain },
        });

        if (!tenant) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email, tenantId: tenant?.id },
          include: { tenant: true }, // cargar tenant
        });

        console.log("User found:", user);
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        // Devuelve objeto que estará disponible en session
        return {
          id: user.id,
          name: user.name || undefined,
          email: user.email,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
          tenantSubdomain: user.tenant.subdomain,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
        token.tenantSubdomain = user.tenantSubdomain;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantName = token.tenantName as string;
        session.user.tenantSubdomain = token.tenantSubdomain as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export default NextAuth(authOptions);
