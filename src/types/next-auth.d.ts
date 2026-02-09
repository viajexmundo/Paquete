import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isActive: boolean;
      canManagePackages: boolean;
      canManageCsv: boolean;
      canManageUsers: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    isActive?: boolean;
    canManagePackages?: boolean;
    canManageCsv?: boolean;
    canManageUsers?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    isActive?: boolean;
    canManagePackages?: boolean;
    canManageCsv?: boolean;
    canManageUsers?: boolean;
  }
}
