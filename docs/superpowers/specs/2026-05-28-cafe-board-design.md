# Cafe-Style Board Design

**Date:** 2026-05-28  
**Goal:** Add a cafe-style bulletin board to the existing Next.js app so anyone can read posts, logged-in users can write posts, and only the original author can edit or delete their own posts.

## Context

The repository already has:

- Next.js App Router
- Auth.js / NextAuth-based authentication
- Prisma + PostgreSQL
- Server Actions for write operations
- A protected dashboard route pattern

That makes this a good fit for a small, focused board feature built on the existing patterns instead of introducing a new stack.

## Product Definition

This feature is a public board, not a full community platform.

### In scope

- Public post list
- Public post detail page
- Logged-in post creation
- Author-only post editing
- Author-only post deletion
- Basic validation and empty states

### Out of scope for MVP

- Comments
- Likes / reactions
- Moderation tools
- Drafts
- Rich text editor
- File uploads
- Search and filtering
- Anonymous posting

## Recommended Approach

### Option A: Server Action CRUD with plain text forms

Use server components for read pages and server actions for create/update/delete. Store posts in Prisma and render forms with a simple textarea-based editor.

Pros:

- Best fit for the current app structure
- Smallest implementation surface
- Strong security posture because ownership checks stay server-side
- Easy to test and reason about

Cons:

- Less polished than a rich editor
- No markdown preview or formatting toolbar in the first version

### Option B: API routes plus client-side CRUD

Expose post endpoints and build the board as a more traditional client-driven app.

Pros:

- Flexible if the board later needs mobile or external clients
- Familiar REST-style separation

Cons:

- More code and more moving parts
- More chances to accidentally duplicate auth checks
- Not aligned with the app's current server-action pattern

### Option C: Rich editor from day one

Use a markdown or WYSIWYG editor immediately.

Pros:

- Better authoring experience out of the box
- Closer to a "real cafe" feel

Cons:

- Larger scope
- More attack surface
- More QA burden for sanitization and rendering

### Recommendation

Option A is the best starting point. It delivers the core cafe-board experience quickly, stays consistent with the repo, and keeps the first version secure and maintainable.

## User Experience

### Navigation

- The home page should show a clear entry point to the board.
- The board list should be public and should be readable without logging in.
- Logged-in users should see a "Write post" action.

### Pages

- `/board` - public post list
- `/board/[id]` - public post detail
- `/board/new` - new post form, login required
- `/board/[id]/edit` - edit form, author only

### List page behavior

- Show newest posts first
- Display title, short body preview, author name, created time
- Empty state when there are no posts

### Detail page behavior

- Show full title and body
- Show author name and timestamps
- Show edit/delete controls only when the viewer is the author

## Data Model

Add a `Post` model to Prisma.

Suggested fields:

- `id`
- `title`
- `body`
- `authorId`
- `createdAt`
- `updatedAt`

Suggested relations:

- `Post.author -> User`

Suggested indexes:

- `authorId`
- `createdAt`

### Validation rules

- Title is required
- Title length should be bounded, for example 1-120 characters
- Body is required
- Body length should be bounded, for example 1-10,000 characters
- Trim whitespace before validation and save

## Authorization Rules

These rules must be enforced on the server, not just hidden in the UI.

- Anyone can read posts
- Only authenticated users can create posts
- Only the post author can update a post
- Only the post author can delete a post
- The client must never send `authorId` as a trusted value
- The server must derive `authorId` from the current session

## Implementation Shape

### Read flow

- Load the board list in a server component
- Query posts through Prisma
- Render list and detail views directly from server data

### Write flow

- Use server actions for create/update/delete
- Check `auth()` inside each action
- Verify ownership before update/delete
- Redirect back to the board or detail page after success

### UI components

Reuse the existing UI stack:

- `Card`
- `Button`
- `Input`
- `Label`
- `Textarea` or a simple equivalent editor component

If a textarea component does not exist yet, add it in the same style as the current UI primitives.

## Error Handling

- Show inline validation errors for missing or invalid title/body values
- Show a friendly access-denied message when a user tries to edit or delete someone else's post
- Show a clear "not found" state when a post id does not exist
- Preserve the user's input if a server action fails validation

## Security Notes

- Ownership checks must happen on the server every time
- Do not trust hidden form fields for author identity
- Do not expose editing routes as implicitly safe just because middleware guards authentication
- If a delete action is implemented, confirm the author check before mutation
- Keep the board public for reads, but do not leak private session data in list/detail responses

## Testing Strategy

### Manual checks

- Anonymous user can open the board list
- Anonymous user can open a post detail page
- Anonymous user is redirected or blocked from `/board/new`
- Logged-in user can create a post
- Author can edit their own post
- Author can delete their own post
- Non-author cannot edit or delete someone else's post

### Automated checks

- Server-side tests for ownership enforcement
- Form validation tests for title/body constraints
- Route or integration tests for public read access
- End-to-end test for create -> edit -> delete flow

## Suggested Rollout

1. Add the `Post` model and migration
2. Build the public list and detail pages
3. Add create, edit, and delete server actions
4. Add the author-only UI affordances
5. Add validation and error states
6. Verify with manual and automated tests

## Open Decisions

The following choices are intentionally left for implementation detail, because they do not change the feature shape:

- Exact title/body length limits
- Whether timestamps display as relative or absolute time
- Whether the board appears on the home page as a preview or only as a dedicated link
- Whether deletion is hard delete or soft delete

For the MVP, hard delete is acceptable if ownership checks and confirmation UX are solid.
