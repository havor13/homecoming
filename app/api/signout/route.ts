import { signOut } from "@/auth";

// Clears a sign-in cookie whose account no longer exists, then sends the person to the sign-in page.
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
