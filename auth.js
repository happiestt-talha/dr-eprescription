import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginIdCandidates, normalizeLoginId } from "@/lib/normalize";
import { clearFailures, isLimited, recordFailure } from "@/lib/rate-limit";

// Compared against when the user doesn't exist, so a login for an unknown
// email/phone takes as long as a wrong password (no account enumeration).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

// How often a signed-in session re-checks that the account is still active.
const ACTIVE_RECHECK_MS = 5 * 60 * 1000;

function clientIp(request) {
  const forwarded = request?.headers?.get?.("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const email = normalizeLoginId(credentials?.email);
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const keys = [`id:${email}`, `ip:${clientIp(request)}`];
        if (isLimited(keys)) {
          console.warn(`[auth] rate-limited login attempt for ${email}`);
          return null;
        }

        // Canonical form first, then the legacy "03…" form of patient phones.
        const candidates = loginIdCandidates(credentials?.email);
        const user = candidates.length
          ? await prisma.user.findFirst({ where: { email: { in: candidates } }, orderBy: { createdAt: "asc" } })
          : null;
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !valid || !user.isActive) {
          recordFailure(keys);
          console.warn(`[auth] failed login for ${email}`);
          return null;
        }

        clearFailures([`id:${email}`]);
        // Best effort: a slow or failed audit write must not block signing in.
        await prisma.auditLog
          .create({ data: { userId: user.id, action: "login_success", entityType: "user", entityId: user.id } })
          .catch((err) => console.error("[auth] could not audit login:", err.message));

        return { id: user.id, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword };
      },
    }),
  ],
  // Sessions last a working day rather than the 30-day default.
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mustChangePassword = Boolean(user.mustChangePassword);
        token.checkedAt = Date.now();
        return token;
      }
      // Deactivated or deleted accounts lose access within ACTIVE_RECHECK_MS,
      // not only when their JWT expires. `update()` from the client (after a
      // password change) forces an immediate re-check.
      if (trigger === "update" || !token.checkedAt || Date.now() - token.checkedAt > ACTIVE_RECHECK_MS) {
        let current;
        try {
          current = await prisma.user.findUnique({
            where: { id: token.id },
            select: { isActive: true, role: true, mustChangePassword: true },
          });
        } catch (err) {
          // A database blip must not sign everyone out (or crash the proxy):
          // keep the session and re-check on the next request.
          console.error("[auth] could not re-check account status:", err.message);
          return token;
        }
        if (!current?.isActive) return null;
        token.role = current.role;
        token.mustChangePassword = current.mustChangePassword;
        token.checkedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.mustChangePassword = Boolean(token.mustChangePassword);
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
