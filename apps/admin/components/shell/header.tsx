import { signOutAction } from "@/lib/actions/auth";
import { getOptionalCurrentUserSession } from "@/lib/services/current-user-service";
import AdminHeaderClient from "./admin-header-client";

export default async function Header() {
  const session = await getOptionalCurrentUserSession();
  const isAuthenticated = session.ok && Boolean(session.user);

  return <AdminHeaderClient isAuthenticated={isAuthenticated} signOutAction={signOutAction} />;
}
