# Admin portal (beginner + security guide)
# ========================================
#
# Allowlist spreadsheet (Excel / Google Sheets compatible):
#   data/authenticated-users.csv
# Columns: email,name,role,active,email_verified
# Only @uwaterloo.ca emails with active=true AND email_verified=true can sign in.
#
# Passwords:
# - NEVER stored in the CSV
# - bcrypt hashes live in data/user-password-hashes.json (gitignored) per user
# - Bootstrap shared hash: ADMIN_PASSWORD_HASH_B64 in .env.local (server only)
# - Set your own password via /admin/reset-password (tokens expire in 1 hour)
#
# Email verification:
# - /admin/verify — request + confirm token (tokens expire in 24 hours)
# - In development, APIs may return `devToken` when email sending is not configured
# - In production, wire Postmark (EMAIL_SERVER) and never return raw tokens in JSON
#
# URLs:
#   Login:     /admin/login   (also "Login" top-right in the navbar)
#   Dashboard: /admin
#   New post:  /admin/posts/new
#   Verify:    /admin/verify
#   Reset:     /admin/reset-password
#
# Security notes:
# - Sessions expire after 2 hours (JWT); secure cookies in production
# - Login, admin APIs, public forms, account/verify/reset, and /api/ai/generate are rate-limited
# - Authors can only read/edit posts they own (ownerEmail); admins can access all
# - Authors cannot delete posts or list the full user allowlist
# - Secrets must stay in .env.local — never NEXT_PUBLIC_* for passwords/tokens
# - No public database; content is markdown under static/blogs/; Sheets keys are server env only
# - Production middleware forces HTTPS (x-forwarded-proto) and blocks probe paths
# - Audit: data/admin-audit.jsonl ; security: data/security.log (both gitignored)
# - Security headers (HSTS, CSP, frame/nosniff) are set in next.config.js
