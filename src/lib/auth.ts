import bcrypt from "bcryptjs";
import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contrasena", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const passwordOk = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!passwordOk) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          canManagePackages: user.canManagePackages,
          canManageCsv: user.canManageCsv,
          canManageUsers: user.canManageUsers,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const enrichedUser = user as {
          role?: string;
          isActive?: boolean;
          canManagePackages?: boolean;
          canManageCsv?: boolean;
          canManageUsers?: boolean;
        };
        token.role = enrichedUser.role;
        token.isActive = enrichedUser.isActive ?? true;
        token.canManagePackages = enrichedUser.canManagePackages ?? false;
        token.canManageCsv = enrichedUser.canManageCsv ?? false;
        token.canManageUsers = enrichedUser.canManageUsers ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string | undefined) ?? "EDITOR";
        session.user.isActive = (token.isActive as boolean | undefined) ?? true;
        session.user.canManagePackages = (token.canManagePackages as boolean | undefined) ?? false;
        session.user.canManageCsv = (token.canManageCsv as boolean | undefined) ?? false;
        session.user.canManageUsers = (token.canManageUsers as boolean | undefined) ?? false;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function auth() {
  return getServerSession(authOptions);
}
