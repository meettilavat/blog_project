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
  bullets: string[];
};

const experiences: Experience[] = [
  {
    role: "Web Dev Trainee",
    company: "Yellow Apple Solutions",
    period: "May – Jul 2023",
    location: "Surat, India",
    bullets: [
      "Built responsive web interfaces with HTML5, CSS3, and JavaScript.",
      "Collaborated with designers to ship user-friendly UI and tuned based on feedback.",
      "Helped triage and resolve UX issues across breakpoints."
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
    name: "Personal Blog",
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-foreground/70">
      {children}
    </span>
  );
}

export default function ResumePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-border/70 bg-card/80 p-8 shadow-soft">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">Meet Tilavat</p>
            <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
              Software engineer & builder focused on clean, dependable interfaces.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-foreground/70">
              Computer Engineering graduate crafting full-stack web apps and experimenting with applied ML.
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-foreground/70">
              <Badge>Based in Gujarat, India</Badge>
              <Badge>Open to full-time roles</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-foreground/80">
            <a className="underline-offset-4 hover:underline" href="mailto:tilavatmeet2@gmail.com">
              tilavatmeet2@gmail.com
            </a>
            <a className="underline-offset-4 hover:underline" href="tel:+919913320031">
              +91 99133 20031
            </a>
            <a className="underline-offset-4 hover:underline" href="https://www.linkedin.com/in/meettilavat">
              linkedin.com/in/meettilavat
            </a>
            <a className="underline-offset-4 hover:underline" href="https://github.com/meettilavat">
              github.com/meettilavat
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Experience</h2>
            <span className="h-px w-16 bg-border" />
          </div>
          <div className="space-y-6">
            {experiences.map((exp) => (
              <div key={exp.company} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-foreground/60">{exp.period}</p>
                    <p className="text-lg font-semibold text-foreground">{exp.role}</p>
                    <p className="text-sm text-foreground/70">{exp.company} · {exp.location}</p>
                  </div>
                </div>
                <ul className="space-y-1 text-sm leading-relaxed text-foreground/80">
                  {exp.bullets.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-[6px] inline-block h-[6px] w-[6px] rounded-full bg-foreground/40" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Education</h2>
            <span className="h-px w-16 bg-border" />
          </div>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.school} className="space-y-1 rounded-2xl border border-border/60 bg-muted/50 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-foreground/60">{edu.period}</p>
                <p className="text-lg font-semibold text-foreground">{edu.school}</p>
                <p className="text-sm text-foreground/80">{edu.credential}</p>
                <p className="text-sm text-foreground/60">{edu.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Projects</h2>
          <span className="h-px w-16 bg-border" />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <div key={project.name} className="rounded-2xl border border-border/60 bg-muted/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{project.name}</p>
                  {project.stack && (
                    <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">{project.stack}</p>
                  )}
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm leading-relaxed text-foreground/80">
                {project.bullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[6px] inline-block h-[6px] w-[6px] rounded-full bg-foreground/40" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Skills</h2>
          <span className="h-px w-16 bg-border" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkillCard title="Languages & Frameworks" items={[...skills.languages, ...skills.frameworks]} />
          <SkillCard title="DevOps & Cloud" items={skills.devops} />
          <SkillCard title="Tools" items={skills.tools} />
          <SkillCard title="Languages (Spoken)" items={skills.languagesSpoken} />
          <SkillCard title="Other" items={skills.other} />
        </div>
      </section>
    </div>
  );
}

function SkillCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
      <p className="text-sm uppercase tracking-[0.18em] text-foreground/60">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
