import { Polar } from "@polar-sh/sdk";

// Server-side Polar client
// Sadece server tarafında (API routes, Server Components) kullanılmalıdır
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || "",
  server: "sandbox", // Production'a geçince "production" yapılacak
});
