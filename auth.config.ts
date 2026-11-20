import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no database or bcrypt imports) used by middleware.
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isPublic = path === "/login" || path === "/join";
      if (isPublic) {
        return loggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }
      return loggedIn;
    },
  },
} satisfies NextAuthConfig;
