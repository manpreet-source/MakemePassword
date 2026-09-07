import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role?: "admin";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
