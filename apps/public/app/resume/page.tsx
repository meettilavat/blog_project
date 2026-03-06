import type { Metadata } from "next";
import StructuredDataScript from "@/components/seo/structured-data-script";
import ResumePage from "@/components/profile/resume-page";
import { getConfiguredSiteUrl } from "@/lib/site-url";
import {
  DEFAULT_SOCIAL_IMAGE_ALT,
  DEFAULT_SOCIAL_IMAGE_PATH,
  RESUME_PAGE_DESCRIPTION,
  RESUME_PAGE_TITLE,
  buildProfilePageStructuredData
} from "@/lib/seo/public-site";

const configuredSiteUrl = getConfiguredSiteUrl();

export const metadata: Metadata = {
  title: RESUME_PAGE_TITLE,
  description: RESUME_PAGE_DESCRIPTION,
  alternates: {
    canonical: "/resume"
  },
  openGraph: {
    type: "profile",
    url: configuredSiteUrl ? `${configuredSiteUrl}/resume` : undefined,
    title: RESUME_PAGE_TITLE,
    description: RESUME_PAGE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE_PATH,
        alt: DEFAULT_SOCIAL_IMAGE_ALT,
        width: 1200,
        height: 630
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: RESUME_PAGE_TITLE,
    description: RESUME_PAGE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE_PATH]
  }
};

export default function Resume() {
  return (
    <>
      {configuredSiteUrl ? (
        <StructuredDataScript data={buildProfilePageStructuredData(configuredSiteUrl)} />
      ) : null}
      <ResumePage />
    </>
  );
}
