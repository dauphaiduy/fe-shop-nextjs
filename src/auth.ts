import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

class LoginError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

function decodeJwtPayload(token: string): {
  sub: number;
  username: string;
  userType: string;
} {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(json);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            const message: string = errBody?.message ?? "";
            if (res.status === 401) {
              const lower = message.toLowerCase();
              if (lower.includes("inactive") || lower.includes("not active")) {
                throw new LoginError("account_inactive");
              }
              throw new LoginError("invalid_credentials");
            }
            throw new LoginError("invalid_credentials");
          }

          const data = await res.json();
          const accessToken: string = data.data?.accessToken;
          if (!accessToken) throw new LoginError("invalid_credentials");

          const payload = decodeJwtPayload(accessToken);

          return {
            id: String(payload.sub),
            name: payload.username,
            accessToken,
            userType: payload.userType,
          };
        } catch (err) {
          if (err instanceof CredentialsSignin) throw err;
          throw new LoginError("invalid_credentials");
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user && "accessToken" in user) {
        token.accessToken = (user as { accessToken: string }).accessToken;
        token.userType = (user as { userType: string }).userType;
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        accessToken: (token.accessToken ?? "") as string,
        user: {
          ...session.user,
          userType: (token.userType ?? "") as string,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
  },
});
