# Post Contracts Governance

This package owns the post domain/persistence compatibility boundary and the repository-side translation contracts that consume it.

## Canonical Modules
- `domain/types.ts`: stable domain contracts (`PostRecord`, `PostListItem`, `DraftSummary`, `PostStatus`, `PostContent`)
- `domain/content-adapter.ts`: explicit adapters between domain `PostContent` and shared rich-content/editor payloads
- `compat/current.ts`: compatibility aliases (`PostRecordCurrent`)
- `types.ts`: temporary compatibility barrel re-exporting `domain/*` and `compat/*`
- `persistence/types.ts`: persistence row contracts (`PostRecordRow`, `PostRecordRowCurrent`)
- `post-contract.ts`: translation boundary from persistence rows (`snake_case`) to domain contracts (`camelCase`)
- `../repository/post-query.ts`: query execution/error policy contract for repositories
- `../repository/admin-posts-repository.ts` + `../repository/public-posts-repository.ts`: admin/public repository adapters

## Boundary Rules
- Posts domain owns `PostContent` and exposes explicit adapter functions in `domain/content-adapter.ts` for rich-content/editor integration points.
- `PostRecordCurrent` and `PostRecordRowCurrent` are stable aliases to active versions.
- Additive contract changes require parser/repository contract test updates in the same change.
- Breaking changes require a new versioned type and explicit adapter updates in `post-contract.ts` before consumer migration.
- Tiptap-specific parsed/sanitized document variants remain editor-domain-local under `lib/tiptap/*`.
- Data-access failure surfaces should use named dual layers when needed: `*Result` for DataResult contracts and `*OrThrow` for explicit exception adapters.

## Contract Test Matrix
| Contract Surface | Required Cases | Test Suite |
| --- | --- | --- |
| Public list/detail query shape | Published-only filters, list/detail parser compatibility, invalid payload rejection | `lib/posts/repository/posts-repository.test.ts` + `lib/posts/contracts/post-contract.test.ts` |
| Admin list/detail data path | Auth/bootstrap misconfiguration mapping, query error mapping, null-detail handling | `lib/posts/repository/posts-repository.test.ts` + `lib/posts/repository/post-query.contract.test.ts` |
| Post contract current-shape compatibility | Current aliases stay stable and parser/repository boundary remains coherent | `lib/posts/contracts/compatibility.contract.test.ts` |

## Required Validation
- `lib/posts/contracts/post-contract.test.ts`
- `lib/posts/contracts/compatibility.contract.test.ts`
- `lib/posts/repository/post-query.contract.test.ts`
- `lib/posts/repository/posts-repository.test.ts`
- `npm run test:governance`
