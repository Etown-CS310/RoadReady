# RoadReady

RoadReady is a vehicle maintenance dashboard that helps users track their vehicles, upcoming maintenance, and service history.

## Tech Stack

### Current

* HTML
* CSS
* JavaScript
* MySQL
* Live Server

### Future

* Node.js backend
* Cloud database

## Project Structure

```text
RoadReady/
├── index.html
│
├── includes/
│   ├── styles.css
│   ├── app.js
│   ├── navbar.js
│   └── footer.js
│
├── js/
│   ├── data.js
│   ├── dashboard.js
│   ├── vehicle.js
│   ├── maintenance.js
│   └── maintenance-guide.js
│
└── web/
    ├── dashboard.html
    ├── vehicle.html
    ├── maintenance.html
    └── maintenance-guide.html
```

## Current Features

* Dashboard
* Vehicle information
* Multiple vehicles
* Vehicle selection
* Maintenance schedules
* Maintenance history
* Maintenance status
* Maintenance guide
* Shared navigation and footer
* Temporary frontend data

## How It Works

1. The user opens RoadReady.
2. The dashboard loads temporary JavaScript data.
3. The user can select a vehicle.
4. RoadReady displays vehicle information and maintenance.
5. Users can view upcoming and completed maintenance.
6. Maintenance guide articles can be viewed by topic.

## Database

The MySQL database contains:

* `users`
* `vehicles`
* `user_vehicles`
* `maintenance_types`
* `vehicle_maintenance_schedule`
* `maintenance_history`
* `maintenance_guide_articles`
* `reminders`

The MySQL database will remain the main source of truth when the backend is added.

## Current Development

The frontend currently uses:

```text
js/data.js
```

as temporary data instead of connecting directly to MySQL.

`localStorage` is also used temporarily for selected vehicles and guide articles.

The current frontend does not have working authentication or database writes.

## Running Locally

The current frontend can be run using VS Code with the Live Server extension.

Open:

```text
index.html
```

with Live Server.

## Future Backend

The backend will eventually be built using:

```text
Node.js
    ↓
REST API
    ↓
MySQL
```

Planned API areas include:

```text
/api/auth
/api/vehicles
/api/maintenance
/api/guides
/api/reminders
```

## Future Features

* User authentication
* Vehicle sharing
* Database-connected dashboard
* Add and complete maintenance
* Automated email reminders
* Vehicle photos
* VIN lookup
* Recalls and known issues
* Vehicle valuation
* CSV/Excel imports
* License and registration syncing
* Expanded maintenance information

## Development Goal

Continue improving the RoadReady frontend first.

Once the frontend is stable, connect it to the existing MySQL database through a Node.js backend.
