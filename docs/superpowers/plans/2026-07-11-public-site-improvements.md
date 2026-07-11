# Public Site Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved visual, accessibility, reliability, performance, security, and resume improvements for the public Next.js site.

**Architecture:** Keep public routes and shared presentation components server-rendered wherever possible, with a client boundary only for browser-owned actions such as printing. Reuse the existing repository, SEO, rich-content, and design-token layers; introduce only focused helpers where a behavior needs isolated testing.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Vitest, and Supabase.

## Global Constraints

- Preserve the existing editorial visual identity and public URLs.
- Publish the supplied PDF at `/resume/meet-tilavat-resume.pdf`.
- Render meaningful content visible before hydration and honor `prefers-reduced-motion`.
- Keep article prose near 72 characters per line while allowing wide media.
- Do not add a new runtime dependency for these UI changes.

---

### Task 1: Restore Type and Dependency Baselines

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `Jenkinsfile`
- Modify: `apps/public/app/__tests__/layout.test.tsx`
- Modify: `apps/public/app/posts/[slug]/page.test.tsx`
- Modify: `config/tailwind/preset.test.ts`

**Interfaces:**
- Produces: `npm run typecheck:public` as the public-app type gate.

- [ ] **Step 1: Add the typecheck script and Jenkins expectation test where appropriate.**

```json
"typecheck:public": "tsc -p apps/public/tsconfig.json --noEmit --incremental false"
```

- [ ] **Step 2: Run `npm run typecheck:public` and confirm the existing three errors.**

- [ ] **Step 3: Narrow metadata assertions with object guards and import `preset.mjs` consistently.**

```ts
expect(metadata.twitter && "card" in metadata.twitter ? metadata.twitter.card : undefined)
  .toBe("summary_large_image");
```

- [ ] **Step 4: Upgrade Next.js and production transitive dependencies.**

```powershell
npm install next@16.2.10 react@19.2.7 react-dom@19.2.7
npm audit fix
```

- [ ] **Step 5: Run typecheck and focused tests to verify green.**

### Task 2: Progressive Motion and Homepage Composition

**Files:**
- Modify: `components/motion/fade-in.tsx`
- Modify: `components/motion/staggered-list.tsx`
- Modify: `components/profile/reveal-section.tsx`
- Modify: their existing tests
- Modify: `apps/public/app/page.tsx`
- Modify: `apps/public/app/__tests__/page.test.tsx`
- Modify: `components/posts/post-card.tsx`
- Modify: `components/posts/__tests__/post-card.test.tsx`

**Interfaces:**
- Produces: `PostCard` optional `priority?: boolean`; count-aware homepage grid classes.

- [ ] **Step 1: Write failing tests asserting visible SSR motion state, reduced-motion support, featured homepage copy, centered two-column layout, and first-cover priority.**

```tsx
expect(html).not.toContain("opacity:0");
expect(postCoverMediaRenderMock).toHaveBeenCalledWith(expect.objectContaining({ priority: true }));
```

- [ ] **Step 2: Run focused tests and verify expected failures.**

- [ ] **Step 3: Implement visible initial states, `useReducedMotion`, the identity/CTA hero, count-aware grid, and first-card priority.**

```tsx
<PostCard priority={index === 0} post={post} href={`/posts/${post.slug}`} variant="public" />
```

- [ ] **Step 4: Run focused tests and refactor only after green.**

### Task 3: Article Readability and Content Pipeline

**Files:**
- Modify: `components/posts/post-detail-article.tsx`
- Modify: `apps/public/app/posts/[slug]/page.test.tsx`
- Modify: `components/content/rich-text/rich-text-viewer.tsx`
- Modify: `components/content/rich-text/rich-text-viewer.test.tsx`
- Modify: `styles/tiptap.css`

**Interfaces:**
- Produces: `RichTextViewer` optional `isSanitized?: boolean` input.

- [ ] **Step 1: Write failing tests for title-before-cover ordering, 72ch reading width, and sanitized-content reuse.**

```tsx
expect(html.indexOf("Published Post")).toBeLessThan(html.indexOf("PostCoverMediaStub"));
expect(analyzeContentMock).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run focused tests and verify red.**

- [ ] **Step 3: Reorder the article header, narrow prose, retain wide media, and bypass duplicate analysis for sanitized content.**

```tsx
<RichTextViewer content={content} isSanitized className="tiptap-editorial" />
```

- [ ] **Step 4: Run focused tests and verify green.**

### Task 4: Resume Artifact and Actions

**Files:**
- Create: `apps/public/public/resume/meet-tilavat-resume.pdf`
- Modify: `components/profile/resume-page.tsx`
- Modify: `components/profile/resume-page.test.tsx`
- Create: `components/profile/print-resume-button.tsx`
- Create: `components/profile/print-resume-button.test.tsx`

**Interfaces:**
- Produces: stable resume download URL and a client-only print button.

- [ ] **Step 1: Write failing tests for download and print actions.**

```tsx
expect(html).toContain('href="/resume/meet-tilavat-resume.pdf"');
expect(html).toContain("Download PDF");
```

- [ ] **Step 2: Run tests and verify red.**

- [ ] **Step 3: Copy the inspected PDF and implement the two actions.**

```tsx
<a href="/resume/meet-tilavat-resume.pdf" download>Download PDF</a>
```

- [ ] **Step 4: Run tests, render the PDF, and verify green plus visual integrity.**

### Task 5: Error States, Accessibility, and Security Headers

**Files:**
- Create: `apps/public/app/error.tsx`
- Create: `apps/public/app/error.test.tsx`
- Create: `apps/public/app/not-found.tsx`
- Create: `apps/public/app/not-found.test.tsx`
- Modify: `apps/public/app/page.tsx`
- Modify: `apps/public/components/public-header.tsx`
- Modify: `apps/public/components/public-footer.tsx`
- Modify: `components/posts/post-card.tsx`
- Modify: `styles/globals.css`
- Modify: `next.config.mjs`
- Modify: relevant existing tests

**Interfaces:**
- Produces: retry-capable route error UI and navigable not-found UI.

- [ ] **Step 1: Write failing tests for data failure vs empty state, route error retry, not-found navigation, larger targets, stronger text opacity, and disabled powered-by header.**

```tsx
expect(html).toContain("Writing is temporarily unavailable");
expect(nextConfig.poweredByHeader).toBe(false);
```

- [ ] **Step 2: Run focused tests and verify red.**

- [ ] **Step 3: Implement the states, target sizes, contrast corrections, background refinement, and header policy.**

```ts
poweredByHeader: false
```

- [ ] **Step 4: Run focused tests and verify green.**

### Task 6: Full Verification

**Files:**
- Modify only if verification exposes a regression.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified public build and browser screenshots.

- [ ] **Step 1: Run lint, all tests, public typecheck, public build, governance tests, and production dependency audit.**

```powershell
npm run lint
npm test
npm run typecheck:public
npm run build:public
npm run test:governance
npm audit --omit=dev
```

- [ ] **Step 2: Verify homepage, article, resume, menu, dark/light themes, and mobile/desktop viewports in the in-app browser.**

- [ ] **Step 3: Confirm the copied PDF checksum matches the supplied source and inspect its latest render.**

- [ ] **Step 4: Confirm `git diff --check` passes and report any remaining limitations.**
