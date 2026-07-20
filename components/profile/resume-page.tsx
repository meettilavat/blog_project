import { cn } from "@/lib/ui/classnames";
import { getPublicLinks } from "@/lib/public-links";
import { FEATURED_POST_SLUG } from "@/lib/posts/featured";
import { AVAILABILITY_STATUS } from "@/lib/profile/availability";
import { ArrowUpRight, Download, Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";

type Experience = {
  role: string;
  company: string;
  period: string;
  location: string;
  bullets: string[];
};

type Education = {
  school: string;
  credential: string;
  period: string;
  location: string;
};

type Project = {
  name: string;
  stack?: string;
  href?: string;
  linkLabel?: string;
  external?: boolean;
  caseStudy?: boolean;
  bullets: string[];
};

const publicLinks = getPublicLinks();

const experiences: Experience[] = [
  {
    role: "Web Development Trainee",
    company: "Yellow Apple Solutions",
    period: "May – Jul 2023",
    location: "Surat, India",
    bullets: [
      "Converted UI mockups into responsive HTML, CSS, and JavaScript pages.",
      "Refined spacing, interaction states, and feedback-driven interface changes.",
      "Fixed layout and interaction regressions before handoff."
    ]
  }
];

const education: Education[] = [
  {
    school: "Pandit Deendayal Energy University (PDEU)",
    credential: "B.Tech, Computer Engineering — CGPA 8.92",
    period: "2021 – 2024",
    location: "Gandhinagar, Gujarat, India"
  },
  {
    school: "Marwadi University",
    credential: "Diploma, Computer Engineering — CGPA 9.00",
    period: "2018 – 2021",
    location: "Rajkot, Gujarat, India"
  }
];

const projects: Project[] = [
  {
    name: "Vriksha Ganana / Tree Census Platform",
    stack: "Kotlin, Jetpack Compose, Django REST, PostGIS, Next.js, Google Cloud, Cloud SQL, GCS",
    href: `/posts/${FEATURED_POST_SLUG}`,
    linkLabel: "Read case study",
    caseStudy: true,
    bullets: [
      "Built an end-to-end municipal tree-census platform for SNMC across an Android field app, Django/PostGIS APIs, and a Next.js operations dashboard.",
      "Implemented map-based field workflows, photo evidence, offline sync, Google Sign-In/JWT auth, and supervisor review flows.",
      "Operated the live SNMC production deployment on GCP with Compute Engine, Cloud SQL/PostgreSQL 18 + PostGIS, GCS photo storage, Nginx, Redis/Celery, and uptime checks."
    ]
  },
  {
    name: "MeetTilavat.com (Blog Platform)",
    stack: "Next.js, Tailwind CSS, Supabase, Tiptap, Docker, Jenkins",
    href: publicLinks.sourceRepository,
    linkLabel: "View source",
    external: true,
    bullets: [
      "Split public read-only site and private admin/editor app backed by Supabase.",
      "Built rich-text publishing with images, tables, and Supabase Storage uploads.",
      "Containerized Docker builds with Jenkins CI/CD for repeatable deploys."
    ]
  },
  {
    name: "Personal Blog (PHP/MySQL)",
    stack: "HTML, CSS, PHP, SQL, JavaScript, AWS",
    bullets: [
      "PHP/MySQL blog with admin publishing, CKEditor formatting, local image uploads, and AWS hosting."
    ]
  },
  {
    name: "Image Caption Generator",
    stack: "ResNet50, LSTM, Python, Streamlit, AWS/Azure",
    bullets: [
      "Trained on Flickr8k using ResNet50 feature extraction + LSTM decoding.",
      "Deployed with Streamlit; experimented across AWS and Azure."
    ]
  },
  {
    name: "Diabetic Retinopathy Classification",
    stack: "CNN ensemble",
    bullets: [
      "Preprocessed fundus images (CLAHE, histogram EQ) and tested segmentation approaches.",
      "Ensembled ResNet, VGG, Inception, and Xception for DR staging."
    ]
  },
  {
    name: "Predicting Engineering Student Performance",
    bullets: [
      "Modeled academic outcomes with RF, GBM, Logistic Regression, and CNN.",
      "Used SHAP/LIME for explainability on a 12k+ student dataset."
    ]
  }
];

const skills = {
  languages: ["Python", "JavaScript", "SQL", "Java", "PHP", "C/C++", "HTML/CSS"],
  frameworks: ["Django REST Framework", "Next.js", "React", "Node.js", "Laravel", "Angular"],
  devops: ["Google Cloud", "Cloud SQL", "GCS", "Docker", "Jenkins", "Nginx", "Linux", "AWS"],
  tools: ["Git", "GitHub", "VS Code", "JetBrains IDEs"],
  backendData: ["PostgreSQL/PostGIS", "REST APIs", "Celery", "Redis"],
  languagesSpoken: ["English (IELTS 8.0)", "Gujarati", "Hindi"],
  other: ["Custom PC building", "Hardware troubleshooting"]
};

export default function ResumePage() {
  return (
    <article className="resume-sheet mx-auto max-w-[88rem] space-y-[clamp(4rem,5vw,5.5rem)]">
      <ResumeHeroSection />

      <ResumeExperienceEducationSection />

      <ResumeProjectsSection />

      <ResumeSkillsSection />
    </article>
  );
}

function ResumeHeroSection() {
  return (
    <header className="border-b border-border/80 pb-[clamp(3rem,5vw,4.5rem)]">
      <div className="grid gap-10 document:grid-cols-[minmax(0,1fr)_minmax(18rem,0.36fr)] document:items-end document:gap-[clamp(3rem,6vw,7rem)]">
        <div className="space-y-6">
          <p className="journal-label">Curriculum vitae / field record</p>
          <h1 className="max-w-[18ch] text-balance font-serif text-[clamp(2.8rem,6.2vw,6.35rem)] leading-[0.96] tracking-[-0.035em] text-foreground">
            Software engineer building dependable web products and systems.
          </h1>
          <p className="max-w-[58ch] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-[1.75] text-foreground/78">
            I enjoy working end-to-end—from feature development to shipping and operations—with a focus on clarity,
            reliability, and automation.
          </p>
          <dl className="grid max-w-[42rem] gap-x-8 gap-y-3 border-y border-border/65 py-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="journal-label">Base</dt>
              <dd className="mt-1 text-foreground/80">Gujarat, India</dd>
            </div>
            <div>
              <dt className="journal-label">Status</dt>
              <dd className="mt-1 text-foreground/80">{AVAILABILITY_STATUS}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
            <a
              className="print:hidden inline-flex min-h-11 items-center gap-2 border-b border-accent/65 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              href="/resume/meet-tilavat-resume.pdf"
              download="Meet_Tilavat_Resume.pdf"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download PDF
            </a>
            <a
              className="inline-flex min-h-11 items-center border-b border-border font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75 transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              href="mailto:tilavatmeet2@gmail.com"
            >
              Email Me
            </a>
            <a
              className="inline-flex min-h-11 items-center gap-1 border-b border-border font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75 transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              href={publicLinks.githubProfile}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
        <address className="not-italic document:border-l document:border-border/75 document:pl-7">
          <div className="flex items-end justify-between gap-4 border-b border-border/75 pb-3">
            <h2 className="journal-label">Contact index</h2>
            <span className="font-mono text-[10px] text-foreground/65">UTC+05:30</span>
          </div>
          <ul className="divide-y divide-border/60">
            <li><ContactRow label="Email" value="tilavatmeet2@gmail.com" href="mailto:tilavatmeet2@gmail.com" icon={<Mail className="h-3.5 w-3.5" aria-hidden="true" />} /></li>
            <li><ContactRow label="Phone" value="+91 99133 20031" href="tel:+919913320031" icon={<Phone className="h-3.5 w-3.5" aria-hidden="true" />} /></li>
            <li><ContactRow label="LinkedIn" value="linkedin.com/in/meettilavat" href={publicLinks.linkedInProfile} external icon={<Linkedin className="h-3.5 w-3.5" aria-hidden="true" />} /></li>
            <li><ContactRow label="GitHub" value="github.com/meettilavat" href={publicLinks.githubProfile} external icon={<Github className="h-3.5 w-3.5" aria-hidden="true" />} /></li>
            <li><ContactRow label="Location" value="Gujarat, India" icon={<MapPin className="h-3.5 w-3.5" aria-hidden="true" />} /></li>
          </ul>
        </address>
      </div>
    </header>
  );
}

function ResumeExperienceEducationSection() {
  return (
    <section className="grid gap-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)] lg:gap-[clamp(4rem,8vw,9rem)]" role="region" aria-labelledby="resume-experience">
      <div>
        <SectionHeading index="01" title="Experience" subtitle="Hands-on product delivery and cross-functional execution." id="resume-experience" />
        <div className="mt-8 space-y-10 border-l border-border/75 pl-6 sm:pl-8" data-resume-timeline="true">
          {experiences.map((exp) => (
            <article key={exp.company} className="relative space-y-4">
              <span className="absolute -left-[calc(1.5rem+3px)] top-1.5 h-[7px] w-[7px] bg-accent sm:-left-[calc(2rem+3px)]" aria-hidden="true" />
              <p className="journal-label tabular-nums">{exp.period}</p>
              <div>
                <h3 className="font-serif text-2xl leading-tight text-foreground">{exp.role}</h3>
                <p className="mt-1 text-sm text-foreground/70">{exp.company} · {exp.location}</p>
              </div>
              <ResumeBulletList items={exp.bullets} className="mt-3" />
            </article>
          ))}
        </div>
      </div>

      <div>
        <SectionHeading index="02" title="Education" subtitle="Core academics with strong engineering outcomes." id="resume-education" />
        <div className="mt-6">
          {education.map((edu) => (
            <article
              key={edu.school}
              className="grid gap-2 border-b border-border/70 py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-5"
            >
              <p className="journal-label tabular-nums">{edu.period}</p>
              <div>
                <h3 className="font-serif text-xl leading-tight text-foreground">{edu.school}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">{edu.credential}</p>
                <p className="mt-1 text-sm text-foreground/70">{edu.location}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResumeProjectsSection() {
  return (
    <section role="region" aria-labelledby="resume-projects">
      <SectionHeading
        index="03"
        title="Selected Projects"
        subtitle="Production work and applied ML builds across web, infra, and experimentation."
        id="resume-projects"
      />
      <div className="mt-6">
        {projects.map((project, index) => (
          <article
            key={project.name}
            data-resume-project="true"
            className="grid gap-5 border-b border-border/75 py-7 project:grid-cols-[3.25rem_minmax(0,1fr)_auto] project:gap-7"
          >
            <p className="font-mono text-[11px] tabular-nums text-accent">{String(index + 1).padStart(2, "0")}</p>
            <div className="min-w-0 space-y-4">
              <div>
                <h3 className="font-serif text-[clamp(1.45rem,2.4vw,2.15rem)] leading-tight text-foreground">{project.name}</h3>
                {project.stack ? <p className="mt-2 max-w-[80ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-foreground/70">{project.stack}</p> : null}
              </div>
              <ResumeBulletList items={project.bullets} />
            </div>
            {project.href ? (
                <a
                  href={project.href}
                  target={project.external ? "_blank" : undefined}
                  rel={project.external ? "noreferrer" : undefined}
                  className="inline-flex min-h-11 items-center gap-1 self-start border-b border-accent/65 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
                >
                  {project.linkLabel ?? "View project"}
                  {project.caseStudy ? <span className="text-foreground/55">· Fig. 01</span> : null}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
            ) : <span aria-hidden="true" />}
          </article>
        ))}
      </div>
    </section>
  );
}

function ResumeSkillsSection() {
  return (
    <section role="region" aria-labelledby="resume-skills">
      <SectionHeading index="04" title="Skills" subtitle="Current stack and tools used in day-to-day delivery." id="resume-skills" />
      <dl className="mt-6 grid ledger:grid-cols-2">
        <SkillGroup title="Languages & Frameworks" items={[...skills.languages, ...skills.frameworks]} />
        <SkillGroup title="DevOps & Cloud" items={skills.devops} />
        <SkillGroup title="Tools" items={skills.tools} />
        <SkillGroup title="Backend & Data" items={skills.backendData} />
        <SkillGroup title="Languages (Spoken)" items={skills.languagesSpoken} />
        <SkillGroup title="Other" items={skills.other} />
      </dl>
    </section>
  );
}

function SectionHeading({ index, title, subtitle, id }: { index: string; title: string; subtitle: string; id?: string }) {
  return (
    <div className="grid gap-3 border-b border-border/75 pb-4 sm:grid-cols-[3rem_minmax(0,1fr)] sm:items-end">
      <span className="font-mono text-[11px] tabular-nums text-accent">{index}</span>
      <div>
        <h2 id={id} className="font-serif text-[clamp(2rem,3.5vw,3rem)] leading-none tracking-[-0.025em] text-foreground">{title}</h2>
        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-foreground/70">{subtitle}</p>
      </div>
    </div>
  );
}

function ContactRow({
  label,
  value,
  icon,
  href,
  external = false
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  href?: string;
  external?: boolean;
}) {
  const rowContent = (
    <>
      <span className="inline-flex h-8 w-6 shrink-0 items-center justify-start text-accent">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-foreground/70">{label}</span>
        <span className="block break-words text-sm text-foreground/85">{value}</span>
      </span>
      {external ? (
        <span className="inline-flex h-7 w-5 shrink-0 items-center justify-end">
          <ArrowUpRight className="h-3.5 w-3.5 text-foreground/70" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  if (!href) {
    return (
      <div className="flex min-h-14 items-center gap-2 py-2.5">
        {rowContent}
      </div>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex min-h-14 items-center gap-2 py-2.5 transition-colors duration-200 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
    >
      {rowContent}
    </a>
  );
}

function ResumeBulletList({
  items,
  className,
  itemClassName
}: {
  items: string[];
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ul className={cn("m-0 list-none space-y-2 p-0", className)}>
      {items.map((item) => (
        <li
          key={item}
          className="grid grid-cols-[0.5rem_minmax(0,1fr)] items-start gap-3"
        >
          <span
            aria-hidden="true"
            className="mt-[0.68rem] inline-block h-px w-2 bg-accent"
          />
          <span className={cn("block text-sm leading-[1.75] text-foreground/85", itemClassName)}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SkillGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div data-resume-skill-group="true" className="border-b border-border/75 py-5 ledger:odd:pr-8 ledger:even:border-l ledger:even:pl-8">
      <dt className="journal-label">{title}</dt>
      <dd className="mt-3">
        <ul className="flex flex-wrap text-sm leading-7 text-foreground/82">
        {items.map((item) => (
          <li key={item} className="after:mx-2 after:text-accent/70 after:content-['/'] last:after:hidden">{item}</li>
        ))}
        </ul>
      </dd>
    </div>
  );
}
