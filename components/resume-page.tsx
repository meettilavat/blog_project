import { cn } from "@/lib/utils";
import { ArrowUpRight, Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { RevealSection } from "@/components/motion/reveal-section";

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
  bullets: string[];
};

const experiences: Experience[] = [
  {
    role: "Web Dev Trainee",
    company: "Yellow Apple Solutions",
    period: "May – Jul 2023",
    location: "Surat, India",
    bullets: [
      "Built responsive product interfaces in HTML, CSS, and JavaScript that held up across desktop and mobile breakpoints.",
      "Partnered with designers to translate mockups into production-ready UI and iterated quickly from feedback.",
      "Triaged and fixed UX regressions in layouts and interactions to improve overall polish and consistency."
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
    name: "MeetTilavat.com (Blog Platform)",
    stack: "Next.js, Tailwind CSS, Supabase, Tiptap, Docker, Jenkins",
    href: "https://github.com/meettilavat/blog_project",
    bullets: [
      "Split public read-only site and a private admin editor for publishing posts.",
      "Rich-text editor with images, tables, and Supabase Storage uploads.",
      "Containerized builds with CI/CD automation for repeatable deploys."
    ]
  },
  {
    name: "Personal Blog (PHP/MySQL)",
    stack: "HTML, CSS, PHP, SQL, JavaScript, AWS",
    bullets: [
      "Full-stack blog with admin panel, CKEditor formatting, and MySQL persistence.",
      "Deployed on AWS, handling server setup and asset uploads."
    ]
  },
  {
    name: "CPU Scheduling Simulator",
    stack: "HTML, CSS, JavaScript",
    bullets: [
      "Visualized multiple scheduling algorithms with interactive Gantt views.",
      "Explainer pages plus JS-driven simulations."
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
  languages: ["Java", "Python", "C/C++", "JavaScript", "PHP", "SQL", "HTML/CSS"],
  frameworks: ["React", "Angular", "Node.js"],
  devops: ["Docker", "Kubernetes", "Jenkins", "AWS", "Linux", "vast.ai", "Google Colab"],
  tools: ["Git", "GitHub", "VS Code", "JetBrains IDEs"],
  languagesSpoken: ["English (IELTS 8.0)", "Gujarati", "Hindi"],
  other: ["Custom PC building", "Hardware troubleshooting"]
};

function PillBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs uppercase tracking-[0.18em] text-foreground/70">
      {children}
    </span>
  );
}

export default function ResumePage() {
  return (
    <div className="resume-sheet mx-auto max-w-[76rem] space-y-8 sm:space-y-10">
      <RevealSection>
      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_220px_at_8%_0%,rgb(184_92_56_/_0.12),transparent),radial-gradient(420px_180px_at_94%_4%,rgb(216_199_173_/_0.18),transparent)]"
        />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] lg:items-start">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">Meet Tilavat</p>
            <h1 className="max-w-[19ch] font-serif text-4xl tracking-tight text-foreground sm:text-5xl lg:text-[3.65rem]">
              Software engineer building dependable web products and systems.
            </h1>
            <p className="max-w-[58ch] text-lg leading-relaxed text-foreground/80 dark:text-foreground/88">
              I enjoy working end-to-end—from feature development to shipping and operations—with a focus on clarity,
              reliability, and automation.
            </p>
            <div className="flex flex-wrap gap-2">
              <PillBadge>Based in Gujarat, India</PillBadge>
              <PillBadge>Open to full-time roles</PillBadge>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                className="inline-flex items-center rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80 transition-[transform,border-color,color] duration-200 hover:-translate-y-[1px] hover:border-foreground/40 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none"
                href="mailto:tilavatmeet2@gmail.com"
              >
                Email Me
              </a>
              <a
                className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80 transition-[transform,border-color,color] duration-200 hover:-translate-y-[1px] hover:border-foreground/40 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none"
                href="https://github.com/meettilavat"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
          <aside className="relative overflow-hidden rounded-2xl border border-border/70 bg-[linear-gradient(160deg,rgb(255_250_242_/_0.16),rgb(36_30_24_/_0.08))] p-5 shadow-soft backdrop-blur-sm sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(320px_160px_at_12%_-8%,rgb(184_92_56_/_0.2),transparent_62%),radial-gradient(280px_130px_at_100%_0%,rgb(216_199_173_/_0.24),transparent_66%)]"
            />
            <div className="relative flex items-center justify-between gap-3">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.26em] text-foreground/70">Contact</h2>
              <span className="inline-flex items-center rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-foreground/70">
                Open to Work
              </span>
            </div>
            <ul className="relative mt-5 space-y-3">
              <li>
                <ContactRow
                  label="Email"
                  value="tilavatmeet2@gmail.com"
                  href="mailto:tilavatmeet2@gmail.com"
                  icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                />
              </li>
              <li>
                <ContactRow
                  label="Phone"
                  value="+91 99133 20031"
                  href="tel:+919913320031"
                  icon={<Phone className="h-4 w-4" aria-hidden="true" />}
                />
              </li>
              <li>
                <ContactRow
                  label="LinkedIn"
                  value="linkedin.com/in/meettilavat"
                  href="https://www.linkedin.com/in/meettilavat"
                  external
                  icon={<Linkedin className="h-4 w-4" aria-hidden="true" />}
                />
              </li>
              <li>
                <ContactRow
                  label="GitHub"
                  value="github.com/meettilavat"
                  href="https://github.com/meettilavat"
                  external
                  icon={<Github className="h-4 w-4" aria-hidden="true" />}
                />
              </li>
              <li>
                <ContactRow
                  label="Location"
                  value="Gujarat, India"
                  icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                />
              </li>
            </ul>
          </aside>
        </div>
      </section>
      </RevealSection>

      <RevealSection>
      <section className="grid gap-6 lg:grid-cols-2" role="region" aria-labelledby="resume-experience">
        <div className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft sm:p-7">
          <SectionHeading title="Experience" subtitle="Hands-on product delivery and cross-functional execution." id="resume-experience" />
          <div className="space-y-6">
            {experiences.map((exp) => (
              <article key={exp.company} className="relative space-y-2 pl-5">
                <span className="absolute left-0 top-2 h-[calc(100%-0.2rem)] w-px bg-border/80" aria-hidden="true" />
                <span className="absolute left-[-3px] top-2 inline-block h-2 w-2 rounded-full bg-accent/80" aria-hidden="true" />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-foreground/60">{exp.period}</p>
                    <p className="text-lg font-semibold text-foreground">{exp.role}</p>
                    <p className="text-sm text-foreground/70">{exp.company} · {exp.location}</p>
                  </div>
                </div>
                <ResumeBulletList items={exp.bullets} className="mt-3" />
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft sm:p-7">
          <SectionHeading title="Education" subtitle="Core academics with strong engineering outcomes." id="resume-education" />
          <div className="space-y-4">
            {education.map((edu) => (
              <article
                key={edu.school}
                className="space-y-1 rounded-2xl border border-border/45 bg-muted/50 p-4 transition-[border-color,background-color] duration-200 hover:border-foreground/25 hover:bg-card/70 motion-reduce:transition-none"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-foreground/60">{edu.period}</p>
                <p className="text-lg font-semibold text-foreground">{edu.school}</p>
                <p className="text-sm text-foreground/80">{edu.credential}</p>
                <p className="text-sm text-foreground/60">{edu.location}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      </RevealSection>

      <RevealSection>
      <section className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft sm:p-7" role="region" aria-labelledby="resume-projects">
        <SectionHeading
          title="Selected Projects"
          subtitle="Production work and applied ML builds across web, infra, and experimentation."
          id="resume-projects"
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.name}
              className="group relative space-y-3 overflow-hidden rounded-2xl border border-border/45 bg-muted/50 p-5 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-[1px] hover:border-foreground/25 hover:bg-card/70 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{project.name}</p>
                  {project.stack && (
                    <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">{project.stack}</p>
                  )}
                </div>
                {project.href && (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/8 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent transition-[border-color,background-color,color] duration-200 hover:border-accent/50 hover:bg-accent/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
                  >
                    Source
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
              <ResumeBulletList items={project.bullets} className="pt-0.5" itemClassName="text-[0.98rem]" />
            </article>
          ))}
        </div>
      </section>
      </RevealSection>

      <RevealSection>
      <section className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft sm:p-7" role="region" aria-labelledby="resume-skills">
        <SectionHeading title="Skills" subtitle="Current stack and tools used in day-to-day delivery." id="resume-skills" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          <SkillCard
            className="xl:col-span-5"
            title="Languages & Frameworks"
            items={[...skills.languages, ...skills.frameworks]}
          />
          <SkillCard className="xl:col-span-4" title="DevOps & Cloud" items={skills.devops} />
          <SkillCard className="xl:col-span-3" title="Tools" items={skills.tools} />
          <SkillCard className="xl:col-span-5" title="Languages (Spoken)" items={skills.languagesSpoken} />
          <SkillCard className="xl:col-span-7" title="Other" items={skills.other} />
        </div>
      </section>
      </RevealSection>
    </div>
  );
}

function SectionHeading({ title, subtitle, id }: { title: string; subtitle: string; id?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h2 id={id} className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-foreground/68 dark:text-foreground/78">{subtitle}</p>
      </div>
      <span className="h-px w-16 bg-border" aria-hidden="true" />
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
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/65 bg-[linear-gradient(145deg,rgb(255_250_242_/_0.28),rgb(36_30_24_/_0.08))] text-foreground/72 shadow-sm">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] uppercase tracking-[0.2em] text-foreground/56">{label}</span>
        <span className="block break-words text-sm font-medium text-foreground/88">{value}</span>
      </span>
      {external ? (
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/65">
          <ArrowUpRight className="h-3.5 w-3.5 text-foreground/56" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/45 bg-card/50 px-3.5 py-2.5">
        {rowContent}
      </div>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex items-center gap-3 rounded-xl border border-border/45 bg-card/50 px-3.5 py-2.5 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-[1px] hover:border-foreground/35 hover:bg-card/78 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none"
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
    <ul className={cn("m-0 list-none space-y-2.5 p-0", className)}>
      {items.map((item) => (
        <li
          key={item}
          className="group grid grid-cols-[0.625rem_minmax(0,1fr)] items-start gap-3 rounded-md px-1 py-0.5 transition-colors duration-200 hover:bg-card/25 motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="mt-[0.56rem] inline-block h-1.5 w-1.5 rounded-full bg-[#9f6f52] ring-[1.5px] ring-[#9f6f52]/20 transition-transform duration-200 group-hover:scale-110 dark:bg-[#c99778] dark:ring-[#c99778]/28 motion-reduce:transition-none"
          />
          <span className={cn("block text-sm leading-[1.72] text-foreground/88 dark:text-foreground/92", itemClassName)}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SkillCard({
  title,
  items,
  className
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/45 bg-muted/40 p-4 transition-[border-color,background-color] duration-200 hover:border-foreground/25 hover:bg-card/65 motion-reduce:transition-none",
        className
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/68">{title}</p>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-full border border-border/55 bg-[linear-gradient(145deg,rgb(255_250_242_/_0.14),rgb(36_30_24_/_0.14))] px-3.5 py-1.5 text-[0.8rem] font-medium leading-none text-foreground/92 shadow-[inset_0_1px_0_rgb(255_250_242_/_0.16)] transition-[border-color,background-color,color,transform] duration-200 hover:border-foreground/45 hover:text-foreground hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
