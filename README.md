# Benauto

Car listing website and staff dashboard for a dealership in Zimbabwe.

- **Website:** browse and filter stock, car pages with photo galleries, WhatsApp and call buttons, enquiries, test-drive bookings, finance applications and trade-in requests. Prices in USD with an optional ZiG estimate.
- **Admin (`/#/admin`):** staff sign in to add and edit cars, upload photos, mark cars reserved or sold, handle leads, update dealership details and manage staff.
- **Stack:** Vite + React + TypeScript + Tailwind CSS, hosted on GitHub Pages. Supabase provides the database, photo storage and staff logins.

## How it fits together

GitHub Pages only serves static files, so the browser talks to Supabase directly. The Supabase URL and publishable key in `.env` are meant to be public; what each visitor can do is enforced inside the database by row-level security (see `supabase/schema.sql`):

| | Visitor | Staff | Admin |
|---|---|---|---|
| See listed cars and photos (not drafts) | ✓ | ✓ all | ✓ all |
| Send an enquiry / booking / application | ✓ | ✓ | ✓ |
| Read and update leads | | ✓ | ✓ |
| Add, edit and delete cars and photos | | ✓ | ✓ |
| Change settings, manage staff, delete leads | | | ✓ |

Private car details (VIN, purchase cost, notes) live in a separate staff-only table. A database trigger refuses more than 5 leads from the same phone number in 10 minutes.

## Day-to-day

- **Add a staff member:** in Supabase go to *Authentication › Users › Add user* (tick *Auto confirm user*), then in the admin go to *Staff* and add them by email.
- **Add a car:** *Admin › Cars › Add a car*. Photos are resized in the browser before upload (full size 1600px plus a 640px thumbnail), so uploads stay small on mobile data. The first photo is the cover.
- **Hide a car:** set it to *Draft*. *Sold* cars stay reachable by link with a SOLD badge but leave the stock list.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and build to dist/
```

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Database

`supabase/schema.sql` is the full schema, already applied to the Supabase project. To recreate it in a new project, run it in the Supabase SQL editor, then make the first admin:

```sql
insert into staff (user_id, full_name, is_admin)
select id, 'Owner', true from auth.users where email = 'you@example.com';
```
