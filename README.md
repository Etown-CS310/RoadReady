# RoadReady

RoadReady is a vehicle maintenance dashboard that helps users track their vehicles, upcoming maintenance, and service history.

## Tech Stack

* PHP
* MySQL
* HTML / CSS / JavaScript
* XAMPP
* MySQLi

## Project Structure

```text
RoadReady/
├── includes/
│   ├── config.php
│   ├── navbar.php
│   ├── footer.php
│   ├── lib.js
│   └── styles.css
│
├── processes/
│   ├── login.php
│   ├── logout.php
│   └── db_test.php
│
└── web/
    ├── dashboard.php
    ├── vehicle.php
    ├── maintenance.php
    └── maintenance_guide.php
```

## Main Features

* User login and sessions
* Vehicle dashboard
* Vehicle information
* Vehicle sharing
* Maintenance schedules
* Maintenance history
* Maintenance status tracking
* Maintenance guide
* Database-driven data
* Email reminder system groundwork

## How It Works

1. User logs in.
2. RoadReady checks their account.
3. The database determines which vehicles they can access.
4. The dashboard displays their vehicle information and maintenance.
5. Users can view upcoming maintenance and service history.
6. Completed maintenance can be recorded in the database.

## Database

The main tables include:

* `users`
* `vehicles`
* `user_vehicles`
* `maintenance_types`
* `vehicle_maintenance_schedule`
* `maintenance_history`
* `maintenance_guide_articles`
* `reminders`

The database is the main source of truth for the application.

## Running Locally

RoadReady is currently designed to run with XAMPP.

Project location:

```text
C:\xampp\htdocs\RoadReady\
```

Start **Apache** and **MySQL** in XAMPP, then open:

```text
http://localhost/RoadReady/processes/login.php
```

## Development Notes

This is currently a development version of RoadReady.

The application uses SHA-256 password hashes for the current test database. Before production, authentication should be changed to PHP's `password_hash()` and `password_verify()`.

`db_test.php` is for development only and should not be exposed in production.

## Future Features

* Vehicle photos
* VIN lookup
* Recalls and known issues
* Vehicle valuation
* CSV/Excel maintenance imports
* Better vehicle sharing
* Automated email reminders
* License/registration syncing
* Expanded maintenance information

## Current Goal

Continue building RoadReady into a complete vehicle maintenance management system with a secure PHP/MySQL backend and user-friendly dashboard.
