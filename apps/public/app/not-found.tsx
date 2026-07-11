import Link from "next/link";
import PublicStatusNotice, { publicStatusActionClass } from "../components/public-status-notice";

export default function PublicNotFound() {
  return (
    <PublicStatusNotice
      label="404 / Unmapped"
      title="Page not found."
      description="This address may have moved. Continue with the latest writing or the current résumé."
      className="my-auto"
    >
        <Link
          href="/"
          className={publicStatusActionClass}
        >
          Read latest
        </Link>
        <Link
          href="/resume"
          className={publicStatusActionClass}
        >
          View resume
        </Link>
    </PublicStatusNotice>
  );
}
