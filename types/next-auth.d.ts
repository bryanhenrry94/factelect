import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      tenantName: string;
      tenantSubdomain: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    tenantId: string;
    tenantName: string;
    tenantSubdomain: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    tenantName: string;
    tenantSubdomain: string;
  }
}
