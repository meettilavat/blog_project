import Link from "next/link";
import PublicStatusNotice, { publicStatusActionClass } from "../../../components/public-status-notice";

export default function PostNotFound() {
  return (
    <PublicStatusNotice
      label="404 / Missing field note"
      title="This field note is not in the index."
      description="It may have been renamed, returned to draft, or removed. The journal index has the current published work."
      className="my-auto"
    >
      <Link href="/" className={publicStatusActionClass}>
        Return to the journal <span aria-hidden="true">→</span>
      </Link>
      <Link href="/resume" className={publicStatusActionClass}>
        View résumé
      </Link>
    </PublicStatusNotice>
  );
}
