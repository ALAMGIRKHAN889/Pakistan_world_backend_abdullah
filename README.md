# Products World — Backend API

Express 5 + MongoDB (Mongoose) REST API: auth, products, orders, coupons, admin, image uploads.
Used by the separate `products-world-frontend` repo.

## Run locally
```bash
npm install
cp .env.example .env     # then fill MONGODB_URI and JWT_SECRET
npm run dev              # http://localhost:5000  (health: /api/health)
```
No `MONGODB_URI`? It falls back to an in-memory database (data is lost on restart) – handy for a quick try.
In MongoDB Atlas: Network Access → allow your IP (or 0.0.0.0/0 for testing).

## Environment
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string for login tokens |
| `CLIENT_URL` | Frontend URL(s) allowed by CORS, comma separated |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin account created on first start |
| `ADMIN_WHATSAPP_NUMBER` | Number used for the order WhatsApp alert link |

## Deploy on Vercel
1. Push this repo to GitHub → Vercel → **Add New Project** → import it (no build settings needed).
2. **Settings → Environment Variables:** `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend's Vercel URL),
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_WHATSAPP_NUMBER`. In Atlas allow `0.0.0.0/0` (Vercel IPs change).
3. Deploy, then open `https://<your-backend>.vercel.app/api/health` → `{"ok":true}`.
4. Put `https://<your-backend>.vercel.app/api` into the frontend's `VITE_API_URL` and redeploy the frontend.

⚠ Vercel can't keep uploaded files: admin image uploads are temporary there. Use image URLs (or Cloudinary/S3) for products.

## Deploy elsewhere
Any Node host (Render, Railway, VPS…): `npm install` then `npm start`. Set the variables above and put the
frontend's live address in `CLIENT_URL`.
**Uploads:** admin-uploaded images are saved in `uploads/`. Many hosts wipe that folder on redeploy — use a
persistent disk, or move uploads to Cloudinary/S3 for production.

## Search
`GET /api/products?q=gold watch` — every word must match name, brand, category or tags (special characters are safe).
