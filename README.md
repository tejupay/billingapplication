# Business ERP AI 🚀

A modern, web-based Enterprise Resource Planning (ERP) platform designed for small-to-medium enterprises (easier and sleeker than Vyapar). Built with **React 18**, **Tailwind CSS**, **Spring Boot 3**, **PostgreSQL**, and **Docker**. Multi-tenant SaaS ready architecture with column-level `tenant_id` data isolation for minimum recurring hosting costs.

---

## 🔑 Pre-Seeded Default Login Accounts

| Role | Username | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **OWNER** | `owner` | `owner123` | Full control, User creation (Manager/Employee), Net Profit graphs, Expenses, Pending customer dues, Security audit logs |
| **MANAGER** | `manager` | `manager123` | Create & edit bills, Inventory stock in/out, Low stock alerts, View staff invoices & reports |
| **EMPLOYEE** | `employee` | `emp123` | Fast Point-of-Sale billing, Product search, Customer lookup, Print invoices, Send via WhatsApp, View own daily sales counter |

---

## ✨ Features Implemented

1. **Security & Role-Based Access (RBAC)**:
   - Closed signup model (Owner creates all staff credentials).
   - JWT token authentication & single-use 10-minute expiry OTP for Password Reset.
   - Comprehensive Security Audit Logging (`LOGIN_SUCCESS`, `USER_CREATED`, `INVOICE_CREATED`, `STOCK_ADJUSTED`).

2. **GST Billing & Sales Terminal**:
   - Point-of-Sale billing screen with Barcode scanner & search support.
   - Indian GST tax calculations (CGST, SGST, IGST), HSN codes, discounts.
   - Tax Invoices, Proforma Quotations, and Sales Return Credit Notes.
   - Dynamic Barcode generator (`JsBarcode`) & UPI QR code generator (`QRCodeSVG`).
   - PDF Invoice view with print support and direct WhatsApp message dispatch.

3. **Stock & Inventory Control**:
   - Stock IN / Stock OUT operations with real-time bill deductions.
   - Low stock alert threshold warnings.
   - Categories and Brands management.

4. **Customer Debt Ledger (CRM)**:
   - Customer profile directory with GSTIN & credit limits.
   - Outstanding balance tracking & payment collection modal.

5. **Staff & Attendance Management**:
   - Employee roster & daily attendance logger (Present, Absent, Leave).
   - Owner staff account creation modal.

6. **Role-Specific Dashboards**:
   - **Owner Console**: Recharts Weekly Revenue & Net Profit trend graphs, Expenses, Employee leaderboards, Customer pending dues.
   - **Manager Console**: Low stock warning table, stock refill modal, store invoices feed.
   - **Employee POS Console**: Fast billing launcher, personal daily bill counter, product quick lookup (strictly isolated from company profit metrics).

---

## 🏃 Quick Start (Local Development)

### Option 1: Frontend Live Server
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Option 2: Docker Compose (Full Stack with PostgreSQL)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend REST API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

---

## 🏗️ Architecture & Multi-Tenancy Design
The application is structured around a column-level `tenant_id` multi-tenancy model. Every model (`User`, `Product`, `Customer`, `Invoice`, `Expense`, `AuditLog`) is scoped to a parent `Tenant`, allowing multiple businesses to run securely on a shared infrastructure with complete data isolation.
