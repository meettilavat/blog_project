# Public Site Improvements Design

## Goal

Improve the public site's reading experience, visual balance, accessibility, resilience, performance, security posture, and resume utility while preserving its warm editorial identity.

## Approved Direction

The existing Fraunces/Source Sans typography, cream-and-rust palette, dark theme, ruled background, rounded editorial cards, and overall content model remain intact. The work is a focused refinement rather than a rebrand.

## Experience Changes

- Homepage: identify Meet Tilavat as a software engineer, provide a resume CTA, feature the newest post, and center sparse post grids.
- Articles: place title and metadata before the cover, constrain prose to 72 characters per line, retain wide media breakouts, and keep table-of-contents behavior.
- Resume: publish the supplied `Meet_Tilavat_Resume.pdf` at `/resume/meet-tilavat-resume.pdf`; add download and print actions; keep the existing web resume.
- Motion: render all content visible in server HTML, remove blur-based entry effects, honor reduced-motion preferences, and retain restrained optional transitions after hydration.
- Accessibility: raise small-text contrast, enlarge mobile utility targets, preserve skip links and semantic landmarks, and add clear error/not-found states.

## Engineering Changes

- Distinguish repository failures from legitimate empty post lists.
- Avoid re-running the rich-content analysis pipeline in `RichTextViewer` when a route already passes sanitized content.
- Prioritize the first homepage cover image.
- Add explicit public-app typechecking to package scripts and Jenkins.
- Fix the existing metadata test typings and Tailwind preset type resolution.
- Upgrade Next.js and affected production dependencies to patched versions.
- Remove the `X-Powered-By` header and narrow the CSP to the origins the app uses while retaining the inline theme bootstrap required by the current architecture.

## Error Handling

- The homepage shows a retry-oriented error panel when posts cannot be loaded and a separate editorial empty state when the query succeeds with zero posts.
- Route-level `error.tsx` provides a client-side retry action.
- Route-level `not-found.tsx` provides navigation back to writing and the resume.

## Verification

- Unit tests cover count-aware grids, first-image priority, failure/empty states, visible SSR motion defaults, reduced-motion behavior, article ordering/width, sanitized content reuse, resume actions, and error pages.
- `npm run lint`, `npm test`, `npm run typecheck:public`, `npm run build:public`, and `npm audit --omit=dev` must be run.
- Browser verification covers homepage, article, resume, error/not-found behavior, dark/light themes, and 390px/1440px viewports.

