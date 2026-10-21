# Benauto: website spec (step 1)

A modern car listing website for a real dealership in Zimbabwe. Hosted free on **GitHub Pages**, with **Supabase** providing the database, photo storage and staff logins.

## 1. What the research showed

**What the best dealer sites do** (from industry guides on 2026 dealer sites)
- Mobile first and fast. Most buyers browse on phones.
- Inventory search with filters for make, model, year, price, body type and more.
- Large photo galleries on every car.
- Contact options on every page: a phone number in a sticky header, short forms and clear buttons.
- Buying tools: a finance calculator, finance pre-approval, trade-in requests and test-drive booking.
- Trust signals: reviews and testimonials, with dealership details shown everywhere.
- SEO: clear page titles, car data marked up for Google, and consistent business details.

**How cars are sold online in Zimbabwe** (from Classifieds.co.zw, ZimAuto and Japan importer guides)
- **Prices are in USD.** Classifieds.co.zw also has a USD/ZiG switch. "Negotiable" tags and was/now prices ("Save 3%") are common.
- **WhatsApp is the main contact channel.** Every listing on Classifieds has a WhatsApp button and a call button.
- **Listing details buyers expect:** year, make, model, price, mileage in km, fuel, transmission, engine size, body type, condition (Used / **Recent Import** / New) and location (city or suburb).
- **Filters buyers use:** make, price range, body type (incl. Single Cab, Double Cab, Minibus), year range, fuel, transmission, engine size, colour and location.
- **Popular stock:** Toyota Hilux, Ford Ranger, Land Cruiser, RAV4, Aqua, Fit, Vitz, Corolla/Allion/Premio, Probox and Honda Fit Hybrid. Most are Japanese imports and right-hand drive.
- **Import context:** imported cars must be 10 years old or newer (2016+ in 2026). Buyers care whether a car is already **duty-paid and registered** or still needs clearing, so the listing shows that.

## 2. Features

### Public website
| Page | What it does |
|---|---|
| Home | Hero with quick search, featured cars, browse by body type and make, why buy from us, reviews, location map and contact details |
| Inventory | Grid of cars with filters (make, model, year range, price range, body type, fuel, transmission, condition, location) and sorting (newest, price low/high, mileage). Filters are kept in the URL so searches can be shared |
| Car detail | Photo gallery (swipe on mobile), price in USD with optional ZiG estimate, key specs, features list, description, duty status, "Reserved/Sold" badge, **WhatsApp button with the car pre-filled in the message**, call button, inquiry form, test-drive form, finance calculator, share button, similar cars |
| Finance | Finance calculator plus a finance application form |
| Sell / Trade-in | Form for customers who want to sell or trade in their car |
| About / Contact | Dealership story, branches, hours, map, phone and WhatsApp |

Always visible on every page: a sticky header with the phone number, and a floating WhatsApp button.

### Admin dashboard (staff only, at `/admin`)
- Email and password login (Supabase Auth). Only accounts the owner creates can log in.
- **Cars:** add, edit, duplicate and delete. Upload many photos, drag to reorder them and pick the cover photo. Set status to Draft, Available, Reserved or Sold, mark cars as featured, and set a reduced price.
- **Leads inbox:** all inquiries, test drives, finance applications and trade-ins in one list, with filter by type and status (New, Contacted, Won, Lost), plus notes. A "Reply on WhatsApp" link for each lead.
- **Settings:** dealership name, phone, WhatsApp number, address, hours and the ZiG exchange rate used for estimates.
- **Dashboard home:** counts of cars in stock and new leads this week.

### Non-functional
- Fast on mobile data: compressed images, lazy loading and small JavaScript bundles.
- Works on GitHub Pages (static files only). All live data comes from Supabase in the browser.
- Security is enforced inside the database through row-level security, not by hiding buttons. See `supabase/schema.sql`.
- Basic SEO: page titles, Open Graph share previews (so WhatsApp links show the car photo) and a sitemap.
- Accessible: good colour contrast, keyboard support and alt text on photos.

## 3. Technology
- **Frontend:** Vite + React + TypeScript, Tailwind CSS and React Router (hash routing, so deep links work on GitHub Pages).
- **Backend:** Supabase for the Postgres database, storage for car photos and auth for staff logins. The free tier is enough to start.
- **Deploy:** GitHub Actions builds the site and publishes it to GitHub Pages on every push to `main`.

## 4. Database
See [`supabase/schema.sql`](../supabase/schema.sql). It has these tables:
- `dealership_settings`: a single row of business details and the ZiG rate
- `staff`: which logged-in users are staff, and whether each is an admin
- `vehicles`: one row per car
- `vehicle_images`: the photos for each car, in display order
- `vehicle_private`: staff-only details for each car (VIN, purchase cost and notes)
- `leads`: inquiries, test drives, finance applications and trade-ins

Storage bucket `vehicle-photos`: anyone can view photos, and only staff can upload or delete them.

**Who can do what**
| | Public visitor | Staff | Admin |
|---|---|---|---|
| View listed cars and photos | ✓ (not drafts) | ✓ all | ✓ all |
| Submit a lead | ✓ (insert only) | ✓ | ✓ |
| Read and update leads | ✗ | ✓ | ✓ |
| Add, edit and delete cars and photos | ✗ | ✓ | ✓ |
| Edit settings and manage staff | ✗ | ✗ | ✓ |

## 5. Still needed from the dealership (placeholders until then)
- Dealership name, logo and brand colours
- Phone number, WhatsApp number, address, hours and branches
- Real car photos and stock, which staff can add through the admin once it's live
- A few customer reviews (optional)

## Sources
- [Spidersnet: Essential features for automotive websites (2026)](https://spidersnet.co.uk/blog/essential-features-for-automotive-websites/)
- [Classifieds.co.zw cars](https://www.classifieds.co.zw/zimbabwe-cars)
- [ZimAuto](https://www.zimauto.co.zw)
- [TokyoCarZ: Importing cars from Japan to Zimbabwe (2026)](https://tokyocarz.com/blog/import-guides/how-to-import-cars-from-japan-to-zimbabwe-full-guide-2026/)
- [BE FORWARD: Importing your first used car to Zimbabwe](https://blog.beforward.jp/car-import-duty/buying-car-payment-process-total-duty-cost.html)
