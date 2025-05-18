import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        fingerprintId: { label: "Fingerprint ID", type: "text" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        // Admin login
        if (credentials.role === "admin") {
          const admin = await prisma.admin.findUnique({
            where: { username: credentials.username },
          });

          if (!admin) return null;

          const isPasswordValid = await compare(
            credentials.password,
            admin.password,
          );
          if (!isPasswordValid) return null;

          return {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: "admin",
          };
        }

        // Voter login via fingerprint
        else if (credentials.role === "voter") {
          const voter = await prisma.voter.findUnique({
            where: { fingerprintId: credentials.fingerprintId },
          });

          if (!voter) return null;

          return {
            id: voter.id,
            name: voter.name,
            email: voter.email || "",
            role: "voter",
            hasVoted: voter.hasVoted,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        if (user.role === "voter") {
          token.hasVoted = user.hasVoted;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        if (token.role === "voter") {
          session.user.hasVoted = token.hasVoted as boolean;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/voter/login",
    error: "/voter/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
