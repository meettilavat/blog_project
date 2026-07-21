import Link from "next/link";
import PublicStatusNotice, { publicStatusActionClass } from "../../../components/public-status-notice";

export default function PostNotFound() {
  return (
    <PublicStatusNotice
      label="404"
      title="Post not found."
      description="It may have been renamed, returned to draft, or removed. The writing index has the current published work."
      className="my-auto"
    >
      <Link href="/" className={publicStatusActionClass}>All writing <span aria-hidden="true">→</span></Link>
      <Link href="/resume" className={publicStatusActionClass}>View résumé</Link>
    </PublicStatusNotice>
  );
}
