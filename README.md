# RoadReady Dashboard

RoadReady is a vehicle maintenance dashboard that gives an at-a-glance view of a vehicle's mileage, upcoming service needs, and maintenance history. The app is built with plain HTML/CSS/JS and split into three files so the layout, styling, and reusable UI pieces can be updated independently.

## File Structure

```
roadready/
├── web/
│   └── index.html       # Page markup + data + render calls
├── includes/
│   ├── styles.css       # All visual styling
│   └── lib.js           # Reusable component render functions
└── images/
    ├── acura-tl.png     # Vehicle photo(s)
    └── ...
```

## Current Features

### Sidebar Navigation
A fixed left-hand nav bar with the RoadReady logo and links to Dashboard, Maintenance, My Vehicle, Reminders, and Maintenance Guide. The active page is highlighted. Built from a single `renderSidebar()` function and a `DEFAULT_NAV_ITEMS` array in `lib.js`, so adding or renaming a nav link only requires editing one list.

### Topbar
Page title, a short subtitle, and a profile chip showing the current user's name.

### Vehicle Card
Displays the active vehicle's name, engine/transmission/body details, current mileage, and a photo.

### Stat Cards
Three at-a-glance metrics:
- **Next Service** – miles until the next service is due
- **Maintenance This Year** – total spend and number of completed services
- **Vehicle Status** – overall health flag (e.g. "Good", "No overdue maintenance")

### Upcoming Maintenance Panel
A list of upcoming services (e.g. oil change, tire rotation, brake inspection), each with a due mileage and a status badge (`DUE SOON`, `UPCOMING`, `OVERDUE`). Includes an "Add Maintenance" button.

### Recent History Panel
A table of completed services with mileage and cost at time of service.

### Responsive Layout
A CSS media query collapses the sidebar width, stacks the content grid into a single column, and reflows the vehicle card and stat cards on screens narrower than 900px.

### Component-Based Architecture
`lib.js` exposes small render functions (`renderSidebar`, `renderTopbar`, `renderVehicleCard`, `renderStats`, `renderMaintenanceList`, `renderHistoryTable`, `renderPanel`, etc.) that take data objects/arrays and return HTML strings. `index.html` keeps its content in plain JS data arrays at the top of the script, so updating what's displayed doesn't require touching markup.

## Possible Future Features

- **Vehicle Photo Carousel** – Replace the static car image with a carousel (left/right arrows) to cycle through photos of multiple vehicles on the account.
- **Car Value Card** – A card showing the vehicle's estimated current market/trade-in value, pulled from a valuation API and updated over time.
- **Recalls & Known Issues Card** – Surfaces open manufacturer recalls and commonly reported software/hardware issues for the vehicle's make, model, and year.
- **CarFax-Style Vehicle History Lookup** – Pull accident, title, and ownership history using the VIN, so owners can see a full history report alongside their own logged maintenance.
- **Excel/CSV Maintenance Import** – Let users upload a spreadsheet of past maintenance records to bulk-populate their history instead of entering each service manually.
- **Multi-Account Vehicle Sharing** – Allow a vehicle to be linked to multiple user accounts (e.g. family members) so everyone can view a shared vehicle's status — like letting the family see Grandma's car.
- **License-Linked Auto-Sync** – Connect to a driver's license/registration to automatically pull in vehicle details (make, model, year, VIN) instead of manual entry.
- **Maintenance Guide Education Content** – Expand the Maintenance Guide page to explain *why* routine repairs matter (oil changes, brake service, tire rotations, etc.), including the risks of skipping them and how they affect long-term vehicle health and resale value.
- **Email Alerts for Upcoming Maintenance** – Automated email reminders sent as a service's due mileage or date approaches, configurable by lead time (e.g. 500 miles or 2 weeks out).