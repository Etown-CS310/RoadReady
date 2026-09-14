# RoadReady

RoadReady is a vehicle maintenance tracking web application built with **PHP, MySQL 8+, HTML, CSS, and JavaScript**. It allows users to manage vehicles, view maintenance schedules and history, track costs, read maintenance guides, and eventually manage reminders and shared vehicle access.

The current application is designed for **XAMPP on Windows** during development and uses MySQL as the application's source of truth.

> **Development note:** This README reflects the current PHP/MySQL architecture and the development changes made so far. It replaces the earlier description of RoadReady as a standalone three-file HTML/CSS/JS dashboard.

---

## 1. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML / CSS / JavaScript |
| Backend | PHP |
| Database | MySQL 8+ |
| Local Development | XAMPP on Windows |
| Database API | PHP MySQLi |
| Character Set | `utf8mb4` |

---

## 2. Project Structure

```text
C:\xampp\htdocs\RoadReady\
│
├── includes\
│   ├── config.php
│   ├── navbar.php
│   ├── footer.php
│   ├── lib.js
│   └── styles.css
│
├── processes\
│   ├── login.php
│   ├── logout.php
│   └── db_test.php
│
└── web\
    ├── dashboard.php
    ├── vehicle.php
    ├── maintenance.php
    └── maintenance_guide.php
```

### Directory responsibilities

#### `/includes/`

Shared resources used throughout the application.

- `config.php` — database configuration and MySQL connection
- `navbar.php` — shared RoadReady navigation
- `footer.php` — shared footer
- `lib.js` — reusable frontend rendering/component functions
- `styles.css` — global styling and responsive layout

#### `/processes/`

Backend/process endpoints rather than primary user-facing pages.

- `login.php` — authentication
- `logout.php` — session termination
- `db_test.php` — development database diagnostics

#### `/web/`

Main authenticated application pages.

- `dashboard.php` — application home/dashboard
- `vehicle.php` — vehicle details
- `maintenance.php` — maintenance scheduling and history
- `maintenance_guide.php` — maintenance education

---

## 3. Application Architecture

RoadReady is organized into four logical layers:

```text
USER
  │
  ▼
/web/
Application Pages
  │
  ▼
/includes/
Shared UI + Database Configuration
  │
  ▼
/processes/
Authentication + Backend Actions
  │
  ▼
MySQL
RoadReady Database
```

The important design principle is that **the database is the source of truth**.

Vehicle access comes from `user_vehicles`, maintenance types come from `maintenance_types`, schedules come from `vehicle_maintenance_schedule`, and completed work comes from `maintenance_history`.

The frontend should not hardcode ownership, maintenance schedules, or user-specific vehicle data when that information is available from the database.

---

# 4. Shared Components

## `config.php`

`config.php` creates the MySQL connection used by PHP pages.

The current local XAMPP configuration is:

```php
$servername = '127.0.0.1';
$username   = 'root';
$password   = '';
$database   = 'roadready';
```

The connection is exposed as:

```php
$conn
```

Pages that need database access load it with:

```php
require_once __DIR__ . '/../includes/config.php';
```

The connection uses the `utf8mb4` character set.

---

## `navbar.php`

The navbar is shared across RoadReady pages rather than being duplicated.

Current navigation:

```text
Dashboard
Maintenance
My Vehicle
Reminders
Maintenance Guide
```

The navbar also supports displaying information for the currently logged-in user.

---

## `footer.php`

Contains the shared footer markup so individual pages do not have to duplicate it.

---

## `styles.css`

The global stylesheet controls:

- Sidebar/navigation
- Top bar
- Dashboard layout
- Vehicle cards
- Statistics cards
- Maintenance panels
- Status badges
- Tables
- Buttons
- Forms
- Login page
- Responsive/mobile behavior

The application uses a consistent dark sidebar with the main content area beside it.

---

## `lib.js`

The JavaScript library contains reusable UI rendering functions.

Current component functions include:

```text
renderSidebar()
renderTopbar()
renderVehicleCard()
renderStatCard()
renderStats()
renderMaintenanceItem()
renderMaintenanceList()
renderHistoryRow()
renderHistoryTable()
renderPanel()
```

The purpose of this file is to keep reusable frontend component logic in one place instead of duplicating it throughout individual pages.

---

# 5. Authentication

## Login flow

The authentication process is:

```text
User opens login.php
        │
        ▼
Enter email + password
        │
        ▼
Validate input
        │
        ▼
Look up user in users table
        │
        ▼
User found?
     ┌──┴──┐
    NO     YES
     │      │
   Error   Hash password
            │
            ▼
       Compare with
       password_hash
            │
         ┌──┴──┐
       FAIL    PASS
        │        │
      Error   Create session
                 │
                 ▼
              Dashboard
```

The user lookup uses a prepared statement equivalent to:

```sql
SELECT id, email, password_hash, full_name, avatar_url
FROM users
WHERE email = ?
LIMIT 1
```

## Current password system

The current development database uses **SHA-256** hashes.

PHP currently calculates:

```php
$hashedPassword = hash('sha256', $password);
```

and compares the result using:

```php
hash_equals(
    $user['password_hash'],
    $hashedPassword
);
```

This matches the existing development database.

### Production warning

SHA-256 by itself is not the preferred method for storing production passwords. Before deployment, RoadReady should migrate to a dedicated password-hashing system such as:

```php
password_hash($password, PASSWORD_DEFAULT);
```

with:

```php
password_verify($password, $hash);
```

The backend hashing algorithm must match the format stored in `password_hash`.

---

# 6. PHP Sessions

After successful authentication, RoadReady stores information in the PHP session.

Current session values include:

```php
$_SESSION['user_id']
$_SESSION['email']
$_SESSION['full_name']
$_SESSION['avatar_url']
```

The most important value is:

```php
$_SESSION['user_id']
```

It identifies the authenticated user for subsequent requests.

The session ID should be regenerated after successful login:

```php
session_regenerate_id(true);
```

---

# 7. Authentication Protection

Protected pages should verify that the user is logged in before continuing.

```text
User requests protected page
          │
          ▼
    Is user logged in?
       ┌───┴───┐
      NO      YES
       │        │
       ▼        ▼
   login.php  Continue
```

After successful login, the user is redirected to:

```text
/web/dashboard.php
```

Logout destroys the authenticated session and returns the user to the login page.

---

# 8. Vehicle Authorization

A critical part of RoadReady's security model is that a logged-in user does **not** automatically have access to every vehicle.

Vehicles do not contain a direct `user_id`.

Instead, access is controlled through:

```text
user_vehicles
```

The relationship is:

```text
users
  │
  ▼
user_vehicles
  │
  ▼
vehicles
```

A vehicle can therefore be shared between multiple users.

For example:

```text
Sam
├── Owner → 2003 Acura TL
└── Owner → 2020 Toyota RAV4

Jamie
└── Family → 2003 Acura TL
```

A vehicle request should use an authorization query equivalent to:

```sql
SELECT v.*
FROM vehicles v
JOIN user_vehicles uv
    ON uv.vehicle_id = v.id
WHERE uv.user_id = ?
  AND v.id = ?;
```

Simply accepting:

```text
?vehicle_id=1
```

is not sufficient.

The server must verify the logged-in user's relationship to the requested vehicle.

---

# 9. Dashboard

`dashboard.php` is the authenticated RoadReady home page.

Example:

```text
http://localhost/RoadReady/web/dashboard.php
```

The dashboard provides a high-level overview of the selected vehicle and its maintenance.

Conceptual layout:

```text
┌─────────────────────────────────────────────────┐
│ Sidebar                  │ Top Bar              │
│                          │ Welcome / User       │
│ Dashboard                ├──────────────────────┤
│ Maintenance              │ Vehicle Card         │
│ My Vehicle               │                      │
│ Reminders                ├──────────────────────┤
│ Maintenance Guide        │ Maintenance Stats    │
│                          │                      │
│                          ├──────────────────────┤
│                          │ Upcoming Maintenance │
│                          │                      │
│                          ├──────────────────────┤
│                          │ Maintenance History  │
└──────────────────────────┴──────────────────────┘
```

The dashboard should display database-driven information rather than hardcoded vehicle information.

## Vehicle selection

A user can have multiple vehicles.

A vehicle can be selected with a URL parameter such as:

```text
dashboard.php?vehicle_id=1
```

The requested vehicle must always be checked against `user_vehicles`.

---

# 10. Dashboard Statistics

RoadReady has three database views used for dashboard information.

## `vehicle_next_service`

Determines the closest upcoming mileage-based service.

It returns:

```text
vehicle_id
next_due_mileage
```

Completed schedule entries are excluded.

## `vehicle_maintenance_this_year`

Provides current-calendar-year maintenance statistics:

```text
vehicle_id
services_completed
total_cost_cents
```

This allows the dashboard to display:

- Services completed this year
- Total maintenance spending this year

without hardcoding the values.

## `vehicle_status`

Calculates the overall vehicle health/status.

Priority:

```text
OVERDUE
   ↓
DUE SOON
   ↓
GOOD
```

If any outstanding maintenance is overdue, the vehicle is `overdue`.

Otherwise, if any outstanding maintenance is due soon, the vehicle is `soon`.

Otherwise, the vehicle is `good`.

---

# 11. Vehicle Page

`vehicle.php` provides detailed information about a selected vehicle.

Example:

```text
http://localhost/RoadReady/web/vehicle.php?vehicle_id=1
```

The page can display:

```text
Vehicle
2003 Acura TL

Make
Acura

Model
TL

Year
2003

Mileage
142,850

Engine
...

Transmission
...

Body Type
...

VIN
...

Role
Owner
```

Vehicle access must be authorized through `user_vehicles`.

---

# 12. Maintenance Page

`maintenance.php` combines scheduled maintenance and maintenance history.

General structure:

```text
Maintenance
│
├── Vehicle Selector
│
├── Upcoming Maintenance
│   ├── Oil Change
│   ├── Tire Rotation
│   └── Brake Inspection
│
├── Add Maintenance Schedule
│
└── Maintenance History
    ├── Date
    ├── Service
    ├── Mileage
    ├── Shop
    ├── Cost
    └── Notes
```

---

# 13. Maintenance Scheduling

Scheduled maintenance is stored in:

```text
vehicle_maintenance_schedule
```

Each schedule connects:

```text
Vehicle
+
Maintenance Type
+
Due Mileage
+
Due Date
+
Status
+
Notes
```

Example:

```text
Acura TL
Oil Change
Due: 143,500 miles
Due Date: 2026-10-01
Status: Soon
```

## Adding maintenance

The intended process is:

```text
User selects vehicle
        │
        ▼
Authorization check
        │
        ▼
Select maintenance type
        │
        ▼
Enter due mileage/date
        │
        ▼
Validate input
        │
        ▼
Insert into vehicle_maintenance_schedule
        │
        ▼
Display updated list
```

Maintenance types should be selected from the database catalog rather than hardcoded into PHP.

---

# 14. Maintenance Status

Database schedule statuses include:

```text
good
soon
overdue
completed
```

The frontend presents active statuses as:

```text
soon     → DUE SOON
good     → UPCOMING
overdue  → OVERDUE
```

Completed maintenance is represented in maintenance history and should not be treated as active upcoming work.

---

# 15. Maintenance Completion

When a scheduled service is completed, RoadReady should:

1. Collect the service date.
2. Collect mileage at service.
3. Collect cost.
4. Collect shop name.
5. Collect notes.
6. Verify vehicle authorization.
7. Start a database transaction.
8. Insert the completed service into `maintenance_history`.
9. Mark the schedule entry as completed or otherwise close it.
10. Commit the transaction.
11. Refresh the maintenance information.

Conceptually:

```text
Scheduled Maintenance
        │
        ▼
User chooses Complete
        │
        ▼
Enter service information
        │
        ▼
Authorization check
        │
        ▼
Database transaction
        │
        ├───────────────┐
        ▼               ▼
 Add history       Mark schedule
   record            completed
        │               │
        └───────┬───────┘
                ▼
          Commit transaction
                │
                ▼
       Updated maintenance
```

A transaction is important so the history and schedule cannot become inconsistent if one database operation fails.

Future maintenance can then be calculated or scheduled where appropriate.

---

# 16. Maintenance Catalog

Maintenance types are stored in:

```text
maintenance_types
```

Current catalog:

```text
1  Oil Change
2  Tire Rotation
3  Brake Inspection
4  Coolant Flush
5  Battery Replacement
6  Air Filter Replacement
7  Transmission Fluid Service
8  Spark Plug Replacement
```

Each type can define default mileage and time intervals.

Current defaults:

| Maintenance | Miles | Months |
|---|---:|---:|
| Oil Change | 5,000 | 6 |
| Tire Rotation | 7,500 | 6 |
| Brake Inspection | 12,000 | 12 |
| Coolant Flush | 30,000 | 24 |
| Battery Replacement | — | 48 |
| Air Filter Replacement | 15,000 | 12 |
| Transmission Fluid Service | 60,000 | 36 |
| Spark Plug Replacement | 30,000 | 24 |

The catalog allows new maintenance types to be added without rewriting every PHP page.

---

# 17. Maintenance History

Completed services are stored in:

```text
maintenance_history
```

A history record contains:

```text
vehicle_id
maintenance_type_id
service_date
mileage_at_service
cost_cents
shop_name
notes
```

Money is stored as integer cents.

Examples:

```text
4800  = $48.00
21000 = $210.00
5500  = $55.00
```

This avoids floating-point currency problems.

History should normally be displayed with the newest service first.

---

# 18. Maintenance Guide

`maintenance_guide.php` provides educational information about maintenance.

Guide content is stored in:

```text
maintenance_guide_articles
```

Each article is associated with a maintenance type.

An article can contain:

```text
Title
Summary
Body
Risks if skipped
```

The guide process is:

```text
User opens Maintenance Guide
        │
        ▼
Query guide articles
        │
        ▼
Display available guides
        │
        ▼
User selects article
        │
        ▼
Display article details
```

The article body is stored in `body_markdown`.

Any Markdown-to-HTML conversion must be performed safely so database content cannot inject unwanted HTML or scripts.

---

# 19. Reminders

The database already contains a:

```text
reminders
```

table.

A reminder connects:

```text
User
+
Maintenance Schedule
+
Lead Mileage
+
Lead Days
+
Notification Channel
+
Sent Status
```

Examples:

```text
500 miles before
14 days before
Email
```

The navigation includes a Reminders entry, while the dedicated reminders interface is still a development area.

The planned reminder system will support configurable lead times such as:

- 500 miles before service
- 300 miles before service
- 14 days before service
- 2 weeks before service

and automated email alerts.

---

# 20. Database Schema

## `users`

Stores application accounts.

Important fields:

```text
id
email
password_hash
full_name
avatar_url
created_at
updated_at
```

`email` is unique.

---

## `vehicles`

Stores physical vehicles.

Important fields:

```text
id
vin
nickname
make
model
model_year
trim
engine
transmission
body_type
current_mileage
image_url
created_at
updated_at
```

VIN is unique but nullable.

Vehicles do not contain a direct `user_id`.

---

## `user_vehicles`

Junction table controlling user access to vehicles.

```text
user_id
vehicle_id
role
created_at
```

Primary key:

```text
(user_id, vehicle_id)
```

Current intended roles:

```text
owner
family
viewer
```

---

## `maintenance_types`

Maintenance master catalog.

```text
id
name
default_interval_miles
default_interval_months
created_at
```

---

## `maintenance_guide_articles`

Educational maintenance content.

```text
id
maintenance_type_id
title
summary
body_markdown
risks_if_skipped
updated_at
```

---

## `vehicle_maintenance_schedule`

Upcoming/due maintenance.

```text
id
vehicle_id
maintenance_type_id
due_mileage
due_date
status
notes
created_at
updated_at
```

---

## `maintenance_history`

Completed maintenance.

```text
id
vehicle_id
maintenance_type_id
service_date
mileage_at_service
cost_cents
shop_name
notes
created_at
```

---

## `reminders`

Maintenance notification preferences.

```text
id
user_id
schedule_id
lead_time_miles
lead_time_days
channel
sent_at
created_at
```

---

# 21. Database Relationships

The core database relationship is:

```text
users
  │
  ├───────────────┐
  │               │
  ▼               ▼
user_vehicles   reminders
  │               │
  ▼               ▼
vehicles       vehicle_maintenance_schedule
  │
  ├──────────────────────┐
  │                      │
  ▼                      ▼
vehicle_maintenance_schedule
  │
  ▼
maintenance_types
  │
  ▼
maintenance_guide_articles

vehicles
  │
  ▼
maintenance_history
  │
  ▼
maintenance_types
```

The most important authorization chain is:

```text
SESSION USER
     │
     ▼
user_vehicles
     │
     ▼
AUTHORIZED VEHICLES
     │
     ├── Dashboard
     ├── Vehicle
     ├── Maintenance
     └── Maintenance History
```

---

# 22. Current Development Data

The development database currently contains:

```text
5 users
5 vehicles
6 user/vehicle relationships
8 maintenance types
5 guide articles
9 upcoming maintenance schedule entries
9 maintenance history entries
3 reminders
3 dashboard views
```

## Test users

```text
Sam Rivera      sam.rivera@example.com
Jamie Chen      jamie.chen@example.com
Alicia Gomez    alicia.gomez@example.com
Marcus Webb     marcus.webb@example.com
Priya Patel     priya.patel@example.com
```

Development credentials are test-only and should not be used in production.

## Test vehicles

```text
1. 2003 Acura TL
   Mileage: 142,850

2. 2018 Honda Civic
   Mileage: 61,200

3. 2015 Ford F-150
   Nickname: The Hauler
   Mileage: 98,750

4. 2020 Toyota RAV4
   Mileage: 34,500

5. 2016 Subaru Outback
   Mileage: 88,000
```

## Current sharing relationships

```text
Sam
├── Owner → 2003 Acura TL
└── Owner → 2020 Toyota RAV4

Jamie
└── Family → 2003 Acura TL

Alicia
└── Owner → 2018 Honda Civic

Marcus
└── Owner → 2015 Ford F-150

Priya
└── Owner → 2016 Subaru Outback
```

---

# 23. Current Acura Example

The development Acura TL has:

```text
Current mileage: 142,850
```

Upcoming:

```text
Oil Change
Due: 143,500
Date: 2026-10-01
Status: SOON

Tire Rotation
Due: 145,000
Date: 2026-11-15
Status: GOOD

Brake Inspection
Due: 146,000
Date: 2026-12-20
Status: GOOD
```

The oil change is approximately:

```text
650 miles away
```

---

# 24. Typical User Journey

```text
┌──────────────┐
│    Login     │
│  login.php   │
└──────┬───────┘
       │
       ▼
 Authentication
       │
       ▼
┌──────────────────┐
│    Dashboard     │
│ dashboard.php    │
└────────┬─────────┘
         │
    ┌────┼─────────────┐
    │    │             │
    ▼    ▼             ▼
 Vehicle Maintenance  Guide
    │    │             │
    │    ├── Upcoming  │
    │    ├── Add       │
    │    └── History   │
    │
    ▼
Vehicle Details
```

---

# 25. Request Processing Pattern

A typical protected PHP page follows:

```text
Browser
  │
  ▼
PHP page
  │
  ├── Start session
  ├── Load config.php
  ├── Verify authentication
  ├── Read request parameters
  ├── Verify authorization
  ├── Query MySQL
  ├── Prepare data
  │
  ▼
HTML output
  │
  ├── navbar.php
  ├── Page content
  └── footer.php
  │
  ▼
Browser
```

Database access, input validation, and authorization remain server-side.

---

# 26. Security Rules

RoadReady should follow these rules during development and production preparation.

### Authentication

Users must authenticate before accessing protected pages.

### Authorization

Every vehicle request must verify the current user's relationship through `user_vehicles`.

### Prepared statements

Use prepared statements for queries involving user input.

### Passwords

Never expose password hashes to the frontend.

Use production-grade password hashing before deployment.

### Sessions

Regenerate the session ID after successful login.

### Money

Store monetary values as integer cents.

### Input validation

Validate IDs, mileage, dates, costs, text fields, and other submitted values on the server.

### Database source of truth

Do not duplicate ownership or maintenance definitions in frontend code when the database already contains the authoritative data.

### Development diagnostics

`db_test.php` is a development utility and should not remain publicly exposed on production hosting.

---

# 27. Database Seed Behavior

The dummy-data seed script uses:

```sql
INSERT IGNORE INTO ...
```

This is intentional so rerunning the seed does not fail on existing duplicate primary-key or unique-key records.

`INSERT IGNORE` skips conflicts; it does **not** update existing records.

This applies to conflicts such as:

- Existing primary keys
- Existing unique emails
- Existing unique VINs
- Existing composite primary keys

---

# 28. Development URLs

When running RoadReady through XAMPP:

### Login

```text
http://localhost/RoadReady/processes/login.php
```

### Dashboard

```text
http://localhost/RoadReady/web/dashboard.php
```

### Vehicle

```text
http://localhost/RoadReady/web/vehicle.php?vehicle_id=1
```

### Maintenance

```text
http://localhost/RoadReady/web/maintenance.php
```

### Maintenance Guide

```text
http://localhost/RoadReady/web/maintenance_guide.php
```

### Database Test

```text
http://localhost/RoadReady/processes/db_test.php
```

`db_test.php` should be treated as a development-only diagnostic page.

---

# 29. Current Development Status

## Established

- RoadReady directory structure
- MySQL database
- XAMPP database connection
- MySQLi `$conn` connection
- Dummy users
- Dummy vehicles
- Vehicle sharing relationships
- Maintenance catalog
- Maintenance schedules
- Maintenance history
- Maintenance guide articles
- Reminders database
- Dashboard database views
- Login page
- PHP sessions
- Shared navigation
- Shared footer
- Global stylesheet
- Shared JavaScript component library
- Database connection testing
- Server-side authorization architecture
- Database-driven dashboard architecture

## Current authentication detail

The development database currently uses SHA-256 password hashes, matched with:

```php
hash('sha256', $password)
```

This is intentionally compatible with the current development data. Production authentication should migrate to `password_hash()` / `password_verify()`.

---

# 30. Next Development Priorities

Recommended order:

1. Finish and verify the protected dashboard.
2. Finish vehicle selection and authorization.
3. Finish the maintenance page.
4. Implement maintenance completion.
5. Automatically calculate/create future maintenance where appropriate.
6. Finish maintenance guide detail pages.
7. Build the Reminders page and email notification workflow.
8. Add profile/account functionality.
9. Add vehicle creation and editing.
10. Add stronger form validation and error handling.
11. Replace development password hashing with production-grade password hashing.
12. Perform a complete security review before deployment.
13. Perform UI polish and responsive testing.

---

# 31. Planned / Future Features

The following features are planned as RoadReady expands.

## Vehicle Photo Carousel

Replace the static vehicle image with a carousel that allows users to cycle through multiple photos.

## Car Value Card

Display an estimated current market/trade-in value using a vehicle valuation API and update the estimate over time.

## Recalls & Known Issues

Display open manufacturer recalls and commonly reported software/hardware issues based on the vehicle's make, model, and year.

## CarFax-Style Vehicle History Lookup

Use the VIN to retrieve available accident, title, and ownership history so users can view a broader vehicle history alongside their maintenance records.

## Excel/CSV Maintenance Import

Allow users to upload spreadsheets of previous maintenance records and bulk-import them into RoadReady.

## Multi-Account Vehicle Sharing

Allow family members or other users to share access to a vehicle through the existing `user_vehicles` architecture.

Example:

```text
Grandma → Owner
Parent  → Family
Child   → Viewer
```

## License/Registration-Linked Auto-Sync

Eventually connect a driver's license or registration service to automatically retrieve vehicle information such as:

```text
Make
Model
Year
VIN
```

This would reduce manual vehicle entry.

## Expanded Maintenance Guide

Expand educational content to explain:

- Why routine maintenance matters
- What happens when maintenance is skipped
- Risks of delaying repairs
- Effects on long-term vehicle health
- Effects on vehicle resale value

## Automated Email Alerts

Send configurable email notifications as maintenance approaches.

Possible triggers:

```text
500 miles before
300 miles before
14 days before
7 days before
```

---

# 32. RoadReady Design Philosophy

RoadReady should remain:

### Database-driven

The UI reflects actual database information.

### User-specific

Users only see vehicles they are authorized to access.

### Modular

Shared UI belongs in `/includes/`.

### Secure

Authentication and authorization happen server-side.

### Expandable

Users, vehicles, maintenance types, guides, schedules, history, and reminders come from database records.

### Maintainable

Pages should reuse shared configuration, navigation, styling, and JavaScript instead of duplicating code.

---

# 33. Final Architecture Summary

```text
RoadReady
│
├── includes/
│   ├── config.php
│   │   └── MySQL connection ($conn)
│   │
│   ├── navbar.php
│   │   └── Shared application navigation
│   │
│   ├── footer.php
│   │   └── Shared footer
│   │
│   ├── styles.css
│   │   └── Global styling
│   │
│   └── lib.js
│       └── Shared frontend components
│
├── processes/
│   ├── login.php
│   │   └── Authentication
│   │
│   ├── logout.php
│   │   └── Session termination
│   │
│   └── db_test.php
│       └── Development database testing
│
└── web/
    ├── dashboard.php
    │   └── Application home
    │
    ├── vehicle.php
    │   └── Vehicle details
    │
    ├── maintenance.php
    │   └── Schedules + maintenance history
    │
    └── maintenance_guide.php
        └── Maintenance education
```

The central security relationship remains:

```text
SESSION USER
     │
     ▼
user_vehicles
     │
     ▼
AUTHORIZED VEHICLES
     │
     ├── Dashboard
     ├── Vehicle
     ├── Maintenance
     └── Maintenance History
```

This authorization chain should remain intact as new RoadReady features are added.
