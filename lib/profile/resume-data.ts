import { FEATURED_POST_SLUG } from "@/lib/posts/featured";
import { getPublicLinks } from "@/lib/public-links";

export type ResumeLink = {
  href: string;
  text: string;
  external?: boolean;
};

/**
 * One row of the resume ledger. `label` fills the mono track; everything else
 * fills the content track. `labelDetail` is a second label line (periods that
 * need a year and a month range).
 */
export type LedgerEntry = {
  label: string;
  labelDetail?: string;
  title: string;
  meta?: string;
  stack?: string;
  bullets?: string[];
  link?: ResumeLink;
};

export type SkillGroup = {
  label: string;
  items: string[];
};

export type ContactRow = {
  label: string;
  value: string;
  href?: string;
};

export type ActionLink = {
  label: string;
  href: string;
  external?: boolean;
  download?: string;
};

const publicLinks = getPublicLinks();

export const RESUME_NAME = "Meet Tilavat";
export const RESUME_ROLE = "Software engineer";
export const RESUME_STANDFIRST =
  "I build and run web products end-to-end — feature work through shipping and operations — with a focus on clarity, reliability, and automation.";

// Single column by design: a second column would put its labels on a fourth
// left edge, which is exactly what this rebuild removes. The time zone folds
// into Base so three rows cover everything.
export const contactRows: ContactRow[] = [
  { label: "Base", value: "Gujarat, India · UTC+05:30" },
  { label: "Email", value: "tilavatmeet2@gmail.com", href: "mailto:tilavatmeet2@gmail.com" },
  { label: "Phone", value: "+91 99133 20031", href: "tel:+919913320031" }
];

export const actionLinks: ActionLink[] = [
  { label: "Download PDF", href: "/resume/meet-tilavat-resume.pdf", download: "Meet_Tilavat_Resume.pdf" },
  { label: "LinkedIn", href: publicLinks.linkedInProfile, external: true },
  { label: "GitHub", href: publicLinks.githubProfile, external: true }
];

export const experience: LedgerEntry[] = [
  {
    label: "2023",
    labelDetail: "May–Jul",
    title: "Web Development Trainee",
    meta: "Yellow Apple Solutions · Surat, India",
    bullets: [
      "Converted UI mockups into responsive HTML, CSS, and JavaScript pages.",
      "Refined spacing, interaction states, and feedback-driven interface changes.",
      "Fixed layout and interaction regressions before handoff."
    ]
  }
];

export const education: LedgerEntry[] = [
  {
    label: "2021–24",
    title: "B.Tech, Computer Engineering — CGPA 8.92",
    meta: "Pandit Deendayal Energy University · Gandhinagar, India"
  },
  {
    label: "2018–21",
    title: "Diploma, Computer Engineering — CGPA 9.00",
    meta: "Marwadi University · Rajkot, India"
  }
];

export const selectedWork: LedgerEntry[] = [
  {
    label: "Production",
    title: "Vriksha Ganana — municipal tree census",
    stack: "Kotlin · Jetpack Compose · Django REST · PostGIS · Next.js · Google Cloud · Cloud SQL · GCS",
    bullets: [
      "Built an end-to-end municipal tree-census platform for SNMC across an Android field app, Django/PostGIS APIs, and a Next.js operations dashboard.",
      "Implemented map-based field workflows, photo evidence, offline sync, Google Sign-In/JWT auth, and supervisor review flows.",
      "Operate the live SNMC production deployment on GCP — Compute Engine, Cloud SQL/PostgreSQL 18 + PostGIS, GCS photo storage, Nginx, Redis/Celery, and uptime checks."
    ],
    link: { href: `/posts/${FEATURED_POST_SLUG}`, text: "Read case study" }
  },
  {
    label: "Production",
    title: "meettilavat.com — this site",
    stack: "Next.js · Tailwind CSS · Supabase · Tiptap · Docker · Jenkins",
    bullets: [
      "Split public read-only site and private admin/editor app backed by Supabase.",
      "Built rich-text publishing with images, tables, and Supabase Storage uploads.",
      "Containerized Docker builds with Jenkins CI/CD for repeatable deploys."
    ],
    link: { href: publicLinks.sourceRepository, text: "View source", external: true }
  },
  {
    label: "Research",
    title: "Diabetic retinopathy classification",
    stack: "CNN ensemble · ResNet · VGG · Inception · Xception",
    bullets: [
      "Preprocessed fundus images (CLAHE, histogram EQ) and tested segmentation approaches.",
      "Ensembled four architectures for DR staging."
    ]
  }
];

/**
 * Superseded or coursework projects. Kept as one muted row rather than three
 * full entries — the PHP blog in particular is superseded by meettilavat.com.
 */
export const earlierWork: string[] = [
  "Image caption generator — ResNet50 feature extraction with LSTM decoding on Flickr8k, deployed with Streamlit.",
  "Student performance modelling — RF, GBM, logistic regression, and CNN with SHAP/LIME explainability over a 12k+ record dataset.",
  "Personal blog — PHP/MySQL with CKEditor publishing, local image uploads, and AWS hosting."
];

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    items: ["Python", "JavaScript", "SQL", "Java", "PHP", "C/C++", "HTML/CSS"]
  },
  {
    label: "Frameworks",
    items: ["Django REST Framework", "Next.js", "React", "Node.js", "Laravel", "Angular"]
  },
  {
    label: "Infra",
    items: ["Google Cloud", "Cloud SQL", "GCS", "Docker", "Jenkins", "Nginx", "Linux", "AWS"]
  },
  {
    label: "Data",
    items: ["PostgreSQL/PostGIS", "REST APIs", "Celery", "Redis"]
  },
  {
    label: "Spoken",
    items: ["English (IELTS 8.0)", "Gujarati", "Hindi"]
  }
];
