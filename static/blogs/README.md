# Blog admin & updating guide

This folder holds the site’s blog posts as Markdown files. Each `.md` file becomes a public page at `/blogs/<filename>`.

> Helper docs in this folder must stay named `README.md` or use `.txt` (not other `.md` names), so they are not published as posts.

---

## How authentication works (briefly)

Access is allowlist-based for `@uwaterloo.ca` emails only.

1. An admin adds your email to `data/authenticated-users.csv` (`active=true`, role `admin` or `author`).
2. You verify your email at `/admin/verify` (token expires in 24 hours).
3. You sign in at `/admin/login` (or **Login** in the navbar) with your password.
4. Sessions last about 2 hours. Passwords are stored as bcrypt hashes on the server — never in the CSV or in frontend code.

Roles:

- **author** — create/edit posts you own
- **admin** — manage all posts and see the user allowlist

---

## Steps to get access

1. Ask a site admin to add your Waterloo email to the authenticated-users spreadsheet.
2. Open `/admin/verify`, request a verification token, and confirm it.
3. If you do not have a personal password yet, use `/admin/reset-password` (token expires in 1 hour).
4. Sign in at `/admin/login`.

---

## Updating / publishing a blog post

### Option A — Admin portal (recommended)

1. Sign in → open `/admin` (or **Admin** in the navbar).
2. Click **New post**, or **Edit** on an existing post you can access.
3. Fill in title, date, image path, description, tags, authors, body (Markdown), and optional Spotlight.
4. Save / publish. The site writes a Markdown file under `static/blogs/`.
5. Visit `/blogs` or `/blogs/<your-slug>` to confirm it looks right.

Authors only see posts they own. Admins can edit any post.

### Option B — Edit Markdown directly

1. Add or edit a `.md` file in this folder (`static/blogs/`).
2. Use the frontmatter fields described in `HOW_TO_ADD_A_POST.txt`.
3. Redeploy / refresh the local server so the listing and article pages pick up the change.

---

## Useful links

| Page | URL |
|------|-----|
| Blog listing | `/blogs` |
| Article | `/blogs/<slug>` |
| Login | `/admin/login` |
| Verify email | `/admin/verify` |
| Reset password | `/admin/reset-password` |
| Dashboard | `/admin` |

More frontmatter detail: see `HOW_TO_ADD_A_POST.txt` in this folder.  
Security/ops notes for admins: see `data/ADMIN_README.txt`.
