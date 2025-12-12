// lib/auth.ts
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

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
          where: {
            email: credentials.email,
            memberships: { some: { tenantId: tenant?.id } },
          },
          include: { memberships: { include: { tenant: true } } }, // cargar tenant
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        const membership = user.memberships.find(
          (m) => m.tenantId === tenant.id
        );
        if (!membership) return null;

        // Devuelve objeto que estará disponible en session
        return {
          id: user.id,
          name: user.name || undefined,
          email: user.email,
          tenantId: membership.tenantId,
          tenantName: membership.tenant.name,
          tenantSubdomain: membership.tenant.subdomain,
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
