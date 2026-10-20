#  Bookwise — Library Management System

> A full-stack college library management system built with Node.js, Express, AngularJS, and SQLite.

---

##  Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Default Credentials](#default-credentials)
- [Environment Variables](#environment-variables)

---

## Overview

**Bookwise** is a college Library Management System (LMS) designed as a DBMS course project. It provides a web-based interface for both **librarians/admins** and **members (students/faculty)** to manage books, borrowing, reservations, and fines — all from a single-page application.

---

## Features

###  Admin / Librarian
- Dashboard with live stats — total books, members, active borrows, overdue books, and fine collection summary
- Full **CRUD** for books and members
- Issue and return books, track borrow records
- Manage book **reservations**
- View and mark **fines** as paid
- Auto-detection of overdue records on every dashboard load

###  Member
- Personal dashboard — active borrows, upcoming due dates, outstanding fines
- Browse the book **catalog** with availability status
- Reserve unavailable books
- View personal fine history

###  Auth
- JWT-based authentication (stored in `localStorage`)
- Role-based routing — admin and member see separate navigation and dashboards
- Password hashing with `bcryptjs`

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | AngularJS 1.8, Vanilla CSS          |
| Backend    | Node.js, Express.js                 |
| Database   | SQLite (via `sqlite` + `sqlite3`)   |
| Auth       | JSON Web Tokens (`jsonwebtoken`)    |
| Passwords  | `bcryptjs`                          |
| Fonts      | Google Fonts (Playfair Display, Source Sans Pro) |

---

## Project Structure

```
Bookwise/WP/
├── backend/
│   ├── controllers/          # Business logic
│   │   ├── auth.controller.js
│   │   ├── books.controller.js
│   │   ├── members.controller.js
│   │   ├── borrow.controller.js
│   │   ├── fines.controller.js
│   │   └── reservations.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js  # JWT verification
│   ├── routes/               # Express route definitions
│   │   ├── auth.routes.js
│   │   ├── books.routes.js
│   │   ├── members.routes.js
│   │   ├── borrow.routes.js
│   │   ├── fines.routes.js
│   │   └── reservations.routes.js
│   ├── db.js                 # SQLite connection helper
│   └── server.js             # Express app entry point
├── frontend/
│   ├── controllers/          # AngularJS controllers
│   ├── views/                # HTML partials (SPA views)
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── dashboard-admin.html
│   │   ├── dashboard-member.html
│   │   ├── books-list.html
│   │   ├── book-detail.html
│   │   ├── add-book.html
│   │   ├── members-list.html
│   │   ├── member-detail.html
│   │   ├── borrow-records.html
│   │   ├── return-book.html
│   │   ├── reservations.html
│   │   └── fines.html
│   ├── css/
│   │   ├── style.css
│   │   └── dashboard.css
│   ├── app.js                # AngularJS app + routing config
│   └── index.html            # SPA shell
├── library.sqlite            # SQLite database file
├── library_db.sql            # SQL Server schema (reference)
├── setup_db.js               # One-time DB setup & seed script
├── package.json
├── .env
└── .gitignore
```

---

## Database Schema

```
members          — Library members (students, faculty, public)
books            — Book catalog with copy tracking
admins           — Librarian / admin accounts
borrow_records   — Checkout & return history
reservations     — Book reservation queue
fines            — Overdue fines per borrow record
```

### Entity Relationship Overview

```
members ──< borrow_records >── books
members ──< reservations   >── books
members ──< fines
borrow_records ──< fines
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- npm

### 1. Clone & Install

```bash
git clone <repo-url>
cd Bookwise/WP
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root (one is already provided):

```env
PORT=3000
JWT_SECRET=bookwise_library_secret_key_2026
```

> The SQLite database variables in `.env` (`DB_SERVER`, etc.) are legacy references from the SQL Server version. The active app uses `library.sqlite` directly.

### 3. Set Up the Database

Run the setup script to create all tables and insert seed data:

```bash
node setup_db.js
```

This will create `library.sqlite` with 6 tables and populate them with sample books, members, and admins.

### 4. Start the Server

```bash
npm start
```

The server starts at **http://localhost:3000**

---

## API Reference

All API routes are prefixed with `/api`.

### Auth — `/api/auth`
| Method | Endpoint     | Description              | Auth |
|--------|-------------|--------------------------|------|
| POST   | `/login`    | Login (member or admin)  | ❌   |
| POST   | `/register` | Register new member      | ❌   |

### Books — `/api/books`
| Method | Endpoint    | Description              | Auth |
|--------|------------|--------------------------|------|
| GET    | `/`         | List all books           | ✅   |
| GET    | `/:id`      | Get book by ID           | ✅   |
| POST   | `/`         | Add a new book           | ✅ Admin |
| PUT    | `/:id`      | Update book details      | ✅ Admin |
| DELETE | `/:id`      | Delete a book            | ✅ Admin |

### Members — `/api/members`
| Method | Endpoint | Description            | Auth |
|--------|----------|------------------------|------|
| GET    | `/`      | List all members       | ✅ Admin |
| GET    | `/:id`   | Get member by ID       | ✅   |
| PUT    | `/:id`   | Update member details  | ✅   |
| DELETE | `/:id`   | Delete member          | ✅ Admin |

### Borrow — `/api/borrow`
| Method | Endpoint      | Description               | Auth |
|--------|--------------|---------------------------|------|
| GET    | `/`           | All borrow records        | ✅ Admin |
| POST   | `/`           | Issue a book              | ✅ Admin |
| PUT    | `/:id/return` | Return a book             | ✅ Admin |

### Reservations — `/api/reservations`
| Method | Endpoint | Description               | Auth |
|--------|----------|---------------------------|------|
| GET    | `/`      | List all reservations     | ✅   |
| POST   | `/`      | Create a reservation      | ✅   |
| PUT    | `/:id`   | Update reservation status | ✅ Admin |

### Fines — `/api/fines`
| Method | Endpoint   | Description         | Auth |
|--------|-----------|---------------------|------|
| GET    | `/`        | List all fines      | ✅   |
| PUT    | `/:id/pay` | Mark fine as paid   | ✅ Admin |

### Dashboard — `/api/dashboard/stats`
| Method | Endpoint | Description                          | Auth |
|--------|----------|--------------------------------------|------|
| GET    | `/`      | Aggregate stats for admin dashboard  | ✅ Admin |

---

## Default Credentials

After running `node setup_db.js`, the following accounts are available:

### Admin
| Role      | Email             | Password   |
|-----------|-------------------|------------|
| Admin     | admin@library.com | `admin123` |
| Librarian | jane@library.com  | `admin123` |

### Members
| Name           | Email             | Password    |
|----------------|-------------------|-------------|
| Arjun Sharma   | arjun@college.edu | `member123` |
| Priya Patel    | priya@college.edu | `member123` |
| Dr. Meena Iyer | meena@college.edu | `member123` |
| Rahul Verma    | rahul@college.edu | `member123` |
| Sneha Gupta    | sneha@college.edu | `member123` |

---

## Environment Variables

| Variable     | Default                            | Description                    |
|--------------|------------------------------------|--------------------------------|
| `PORT`       | `3000`                             | Port the server listens on     |
| `JWT_SECRET` | `bookwise_library_secret_key_2026` | Secret used to sign JWT tokens |

> **Note:** Never commit real secrets to version control. The `.env` file is included here for development convenience only.

---

*Built as a DBMS Course Project — © 2026 Bookwise*
