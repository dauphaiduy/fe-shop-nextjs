export {};

// next-auth v5 defines Session/User in @auth/core/types — augment there
declare module "@auth/core/types" {
  interface Session {
    accessToken: string;
    user: {
      userType: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    accessToken: string;
    userType: string;
  }
}

// Keep next-auth module augmentation for compatibility (e.g. useSession types)
declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      userType: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    accessToken: string;
    userType: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    userType?: string;
  }
}
