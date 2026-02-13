# Stage 6 — Admin Dashboard

> **Goal:** Build the super admin panel for platform management — user management, organizer approvals, event oversight, and platform-wide analytics.

---

## 6.1 Admin Route Protection

- Admin pages live under `/dashboard/admin/`.
- Middleware checks: user must have `role: "admin"`.
- Non-admin users trying to access → redirect to `/dashboard` with denied toast.
- Admin navigation items only shown to admin-role users.

---

## 6.2 Admin Dashboard Overview

### Page: `/dashboard/admin`

**KPI Cards:**

| Metric                     | Source                                    |
| -------------------------- | ----------------------------------------- |
| Total Users                | Count of `users` collection               |
| Total Runners              | Users where `role == "runner"`            |
| Total Organizers           | Users where `role == "organizer"`         |
| Total Events               | Count of `events` collection              |
| Active Events              | Events where `status == "published"`      |
| Total Registrations        | Count of `registrations` collection       |
| Total Revenue              | Sum of all successful payments            |
| Pending Organizer Apps     | `organizerApplications` where `status == "pending"` |

**Charts:**
- Registrations over time (line chart — last 30 days / 6 months / 1 year)
- Revenue over time (line chart)
- Top events by registrations (bar chart)
- Users by role distribution (donut chart)

**Quick Links:**
- Pending organizer applications (with count badge)
- Recent events
- Recent registrations

---

## 6.3 Organizer Application Management

### Page: `/dashboard/admin/applications`

**Table columns:**
- Applicant name
- Organizer name
- Email
- Phone
- Applied date
- Status (Pending / Approved / Rejected)
- Actions

**Actions:**
- **Approve** — Updates:
  1. `organizerApplications` doc → `status: "approved"`, `reviewedAt`, `reviewedBy`
  2. User doc → `role: "organizer"`, `organizer.approved: true`, `organizer.approvedAt`
- **Reject** — Dialog asking for rejection reason. Updates:
  1. `organizerApplications` doc → `status: "rejected"`, `rejectionReason`, `reviewedAt`, `reviewedBy`

**Filters:** All, Pending, Approved, Rejected

---

## 6.4 User Management

### Page: `/dashboard/admin/users`

**Table columns:**
- Avatar + Name
- Email
- Role (with badge)
- Profile completion %
- Joined date
- Registrations count
- Actions

**Actions:**
- **View profile** — Full user details in a slide-over/modal
- **Change role** — Dropdown to change role (runner/organizer/admin) with confirmation
- **Disable account** — Soft-delete / disable flag (prevents login)

**Search & Filters:**
- Search by name or email
- Filter by role
- Filter by join date range
- Sort by name, date, registrations

---

## 6.5 Event Management

### Page: `/dashboard/admin/events`

**Table columns:**
- Event name
- Organizer
- Date
- Status
- Categories count
- Registrations
- Revenue
- Actions

**Actions:**
- **View** — Opens event detail (same as organizer view, read-only)
- **Feature/Unfeature** — Toggle `featured` flag on event
- **Cancel event** — Sets status to `cancelled` (with confirmation + reason)
- **Delete** — Hard delete (with double confirmation, admin-only)

**Filters:** All, Draft, Published, Featured, Cancelled, Completed

---

## 6.6 Platform Analytics

### Page: `/dashboard/admin/analytics`

More detailed analytics beyond the overview:

- **Revenue analytics:**
  - Revenue by month (bar chart)
  - Revenue by organizer (table)
  - Revenue by event (table)
  - Average ticket price
  - Platform commission tracking (if applicable in the future)

- **User analytics:**
  - New user signups over time
  - User retention (returning registrations)
  - Geographic distribution (if location data available)

- **Event analytics:**
  - Events created over time
  - Average participants per event
  - Most popular distances
  - Average event completion rate

---

## 6.7 Suggested Additional Admin Functions

Based on your initial plan, here are recommended extra admin capabilities:

| Feature                        | Description                                                    |
| ------------------------------ | -------------------------------------------------------------- |
| **Audit Log**                  | Track all admin actions (approvals, role changes, deletions)   |
| **Announcements / Notices**    | Broadcast a banner/message to all users (e.g. maintenance)    |
| **Support Tickets**            | View & respond to user-submitted inquiries                    |
| **Content Moderation**         | Flag/review event descriptions & images for policy violations |
| **System Health**              | Monitor Firebase usage, Cloudinary quota, API error rates     |
| **Platform Settings**          | Configure global settings (featured events slots, max gallery images, payment commission %) |
| **Export / Reports**           | Generate and download CSV/PDF reports for any data table       |
| **Email Templates**            | Manage email notification templates (for future email integration) |

> [!NOTE]
> These are recommendations. Implement based on priority. The audit log and platform settings are the most critical additions.

---

## 6.8 Charting Library

Use a lightweight, modern charting library:

```
npm install recharts
```

`recharts` is React-native, composable, and works well with Next.js SSR.

---

## 6.9 Deliverables Checklist

- [x] Admin route protection (middleware + client-side) ✅
- [x] Admin dashboard overview with KPI cards + charts ✅
- [x] Organizer application management (approve/reject flow) ✅
- [x] User management (search, filter, role changes, disable) ✅
- [x] Event management (feature, cancel, delete) ✅
- [x] Platform analytics page with revenue, user, and event breakdowns ✅
- [x] Audit log for admin actions ✅
- [x] Export to CSV functionality for all data tables ✅
