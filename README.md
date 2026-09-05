# ConnectBill – Internet & Cable Customer Management and Billing System

**ConnectBill** is a modern, production-ready, full-stack billing and customer management platform designed for local cable TV operators and Internet Service Providers (ISPs) managing **BSNL**, **RailWire**, and **GTPL** connections.

Built with a **React (Vite) + Tailwind CSS** frontend and a robust **Node.js + Express + Mongoose** backend, it features dual role-based portals with cryptographic payment verification, automated monthly billing, and digital PDF invoices.

---

## Key Highlights

- **Dual Portals with Strict RBAC**:
  - **Customer Portal**: Mobile-first OTP login (no passwords needed), view active line details, single and multi-bill pending payment checkout, printable/downloadable digital PDF receipts, payment history, and direct WhatsApp/Phone support desk.
  - **Admin Portal**: High-density management dashboard with Recharts visualizations, subscriber directory, connection management, BSNL/RailWire/GTPL provider management, tariff packages, automated duplicate-safe monthly billing (cron + on-demand), counter cash recording with partial payment support, collections breakdown by payment mode, and CSV financial exports.
- **Secure Payment Architecture**:
  - Integrated with **Razorpay** checkout.
  - Order creation and HMAC SHA256 cryptographic signature verification on the backend.
  - No sensitive card, CVV, or UPI PIN credentials ever touch the application server.
  - Safe transaction logs (payment ID, order ID, amount, method, timestamp).
  - Built-in simulation mode for immediate evaluation without live payment keys.
- **Production-Ready & Zero-Friction**:
  - Connects to any **MongoDB Atlas** or local MongoDB cluster.
  - Includes an automatic zero-friction fallback to embedded in-memory MongoDB when no local daemon is running.
  - Prepared for **Netlify** frontend deployment and **Render / Railway** backend hosting.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, Recharts, React Hot Toast, jsPDF, html2canvas |
| **Backend** | Node.js, Express.js, REST API, JSON Web Tokens (JWT), bcryptjs, Razorpay SDK, node-cron, Express Rate Limit, Helmet, CORS |
| **Database** | MongoDB & Mongoose (with MongoDB Atlas support and embedded fallback) |
| **Deployment** | Netlify (Frontend), Render / Railway (Backend), MongoDB Atlas (Database) |

---

## Project Structure

```
connectbill/
├── package.json              # Concurrently runner (dev, install:all, seed, build)
├── netlify.toml              # Root Netlify deployment configuration
├── .env.example              # Central environment variables template
├── server/
│   ├── package.json
│   ├── server.js             # Express application & HTTP server
│   ├── seed.js               # Realistic demo data seeder
│   ├── test-api.js           # Automated end-to-end API test suite
│   ├── config/
│   │   ├── db.js             # Mongoose connection with memory fallback
│   │   └── razorpay.js       # Razorpay client & signature verification
│   ├── models/
│   │   ├── User.js           # Admin & Customer auth records
│   │   ├── Customer.js       # Subscriber profile & address
│   │   ├── Provider.js       # BSNL, RailWire, GTPL networks
│   │   ├── Plan.js           # Subscription tariff packages
│   │   ├── Connection.js     # Physical connection line tracking
│   │   ├── Bill.js           # Invoices with unique compound index
│   │   ├── Payment.js        # Transaction records (Cash, UPI, Online, Bank)
│   │   ├── Receipt.js        # Official digital receipts
│   │   ├── Notification.js   # In-app notifications
│   │   ├── Setting.js        # Company branding & invoice prefixes
│   │   └── SupportTicket.js  # Subscriber help desk inquiries
│   ├── controllers/          # Business logic & route handlers
│   ├── routes/               # Modular Express API endpoints
│   ├── middleware/           # JWT auth, role authorization, error handler
│   └── services/             # OTP service, cron bill scheduler, reminders
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── netlify.toml          # Client Netlify configuration & redirects
    ├── public/
    │   └── _redirects        # Netlify SPA fallback rule
    └── src/
        ├── App.jsx           # Application routing & toast provider
        ├── main.jsx
        ├── index.css         # Tailwind & print styles for PDF receipts
        ├── api/
        │   └── axiosClient.js # Axios instance with JWT interceptors
        ├── context/
        │   └── AuthContext.jsx # Unified Admin & Customer auth context
        ├── components/
        │   ├── common/       # Navbar, Footer, Modal, StatCard, Razorpay modal
        │   ├── customer/     # CustomerHeader, CustomerBottomNav, CustomerLayout
        │   └── admin/        # AdminHeader, AdminSidebar, AdminLayout
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── auth/         # CustomerLogin (OTP) & AdminLogin
        │   ├── customer/     # Dashboard, Bill, Pending, History, Connection, Receipt, Support
        │   └── admin/        # Dashboard, Customers, Connections, Providers, Plans, Bills, Payments, Collections, Reports, Settings
        └── utils/
            ├── formatters.js # Currency (₹), date, and badge styling helpers
            └── pdfGenerator.js # PDF receipt export engine
```

---

## Environment Configuration

Copy `.env.example` to `server/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (Leave empty for automatic in-memory fallback, or paste Atlas URI)
MONGODB_URI=

# JWT
JWT_SECRET=connectbill_super_secret_jwt_key_2026_production
JWT_EXPIRES_IN=7d

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=rzp_secret_placeholder
RAZORPAY_WEBHOOK_SECRET=razorpay_webhook_secret_sample
RAZORPAY_SIMULATE=true

# OTP Service
MOCK_OTP_MODE=true
FIXED_DEV_OTP=123456

# URLs & CORS
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

---

## Local Quickstart

### 1. Install Dependencies
From the project root:
```bash
npm install
npm run install:all
```

### 2. Seed Demo Data
Populate realistic demo customers, connections, plans, bills, and payments:
```bash
npm run seed
```

**Demo Credentials**:
- **Admin Portal**: `admin@connectbill.com` / `admin123` (or phone `9999999999`)
- **Customer 1**: Phone `9000000001` (Ravi Kumar – BSNL Fiber, Current Bill: ₹799)
- **Customer 2**: Phone `9000000002` (Kumar – RailWire RW123456, Total Pending: ₹1,398)
- **Customer 3**: Phone `9000000003` (Suresh – GTPL Combo, Partial Payment recorded)
- **Customer 4**: Phone `9000000004` (Anita Roy – RailWire 200, Fully Paid)

*Note: In development mock mode, the OTP is `123456` with one-click autofill in the UI.*

### 3. Run Application Concurrently
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Deploying on Netlify (Frontend)

The frontend is ready for immediate deployment on Netlify with SPA routing and build optimizations.

### Method 1: Netlify Web Dashboard (via GitHub / GitLab)
1. Push this repository to GitHub.
2. Log in to [Netlify](https://app.netlify.com/) and click **"Add new site"** > **"Import an existing project"**.
3. Select your repository.
4. Configure the build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist` (or `dist` if base is set to `client`)
5. In **Environment variables**, set:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api` (URL of your deployed backend)
6. Click **"Deploy Site"**.

*The included `client/netlify.toml` and `client/public/_redirects` will automatically handle Single Page App routing for all `/customer/*` and `/admin/*` URLs.*

### Method 2: Netlify CLI
From `connectbill/client`:
```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

---

## Deploying Backend (Render / Railway / VPS)

1. Create a free **MongoDB Atlas** database cluster at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas) and obtain your connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/connectbill?retryWrites=true&w=majority`
2. Create a Web Service on **Render** or **Railway**:
   - **Root directory**: `server`
   - **Build command**: `npm install`
   - **Start command**: `node server.js`
3. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default for Render)
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `JWT_SECRET`: A long secure random string
   - `FRONTEND_URL`: Your deployed Netlify URL (e.g., `https://your-app.netlify.app`)
   - `RAZORPAY_KEY_ID`: Your Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
   - `RAZORPAY_SIMULATE`: `false` (in production)
   - `MOCK_OTP_MODE`: `false` (in production)
4. (Optional) Run database seed once on deployment:
   ```bash
   node seed.js
   ```

---

## API Reference

### Authentication
- `POST /api/auth/admin/login`: Admin login with email/phone and password.
- `POST /api/auth/customer/send-otp`: Request 6-digit OTP to registered subscriber mobile.
- `POST /api/auth/customer/verify-otp`: Verify OTP and receive customer JWT token.
- `GET /api/auth/me`: Validate session and return authenticated user details.
- `POST /api/auth/logout`: End session.

### Customers
- `GET /api/customers`: List subscribers with filters (provider, status, area, billing dues).
- `POST /api/customers`: Register new customer with physical connection line and plan.
- `GET /api/customers/:id`: Full customer dossier with all historical bills and payments.
- `PUT /api/customers/:id`: Update subscriber profile and tariff plan.
- `DELETE /api/customers/:id`: Deactivate subscriber and disconnect line.
- `GET /api/customers/profile`: Authenticated customer profile (derived from JWT).

### Providers & Plans
- `GET /api/providers`: List BSNL, RailWire, GTPL with live customer counts, monthly runrates, and collections.
- `POST /api/providers`: Add custom ISP partner.
- `GET /api/plans`: List tariff packages filtered by provider.
- `POST /api/plans`: Create new subscription package.

### Bills & Invoices
- `GET /api/bills`: List invoices (customers see only their own; admin sees all with filters).
- `GET /api/bills/pending`: List all unpaid, partial, and overdue invoices.
- `POST /api/bills/generate-monthly`: Trigger automated duplicate-safe monthly billing for all active customers.
- `POST /api/bills`: Generate single manual invoice.
- `PUT /api/bills/:id/cancel`: Cancel unpaid invoice.

### Payments & Razorpay
- `POST /api/payments/create-order`: Generate Razorpay payment order for single or multiple bills.
- `POST /api/payments/verify`: Cryptographically verify HMAC SHA256 payment signature and settle bill.
- `POST /api/payments/record-cash`: Record counter cash payment with partial amount support.
- `POST /api/payments/webhook`: Webhook listener for background asynchronous payment capture.
- `GET /api/payments`: Audit log of all transactions.
- `GET /api/payments/receipt/:id`: Formatted digital tax receipt for printing or PDF export.

### Reports & Analytics
- `GET /api/reports/dashboard`: High-level KPIs, 6-month revenue trends, daily collection breakdowns, and provider distributions.
- `GET /api/reports/collections`: Period collection reports (Today, Week, Month, Custom) by Cash, UPI, Online, Bank.
- `GET /api/reports/providers`: Provider breakdown with CSV export support.

### Notifications & Reminders
- `GET /api/notifications`: Feed of payment successes, overdue notices, and system alerts.
- `POST /api/notifications/send-reminder`: Generate WhatsApp/SMS reminder templates with dynamic customer tags.

### Support
- `POST /api/support`: Subscriber technical complaint submission.
- `GET /api/support`: Operator support queue with status updates (Open, In Progress, Resolved).

---

## Security Best Practices

1. **Payment Credentials**: No credit card, CVV, or UPI PIN numbers are ever handled or stored. All online payments use Razorpay's checkout modal.
2. **Server-Side Verification**: Bills are marked as `PAID` only after HMAC SHA256 cryptographic verification of `order_id` and `payment_id` on the backend.
3. **Strict Authorization**: Customer identity is strictly derived from the verified JWT token (`req.customer._id`). Client requests cannot spoof another customer's ID.
4. **Password Protection**: Admin credentials are encrypted with `bcrypt` (10 salt rounds). Plaintext passwords are never stored.
5. **Rate Limiting & Headers**: Integrated `express-rate-limit` on OTP requests and `helmet` for HTTP security headers.
