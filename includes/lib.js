/**
 * RoadReady component library.
 * Small render functions that build the repeated pieces of the dashboard
 * (sidebar/nav, topbar, stat cards, maintenance rows, history rows).
 * Each function returns an HTML string you can drop into a container's innerHTML.
 */

/* ---------- SIDEBAR / NAV ---------- */

/**
 * @param {Array<{href: string, icon: string, label: string}>} items
 * @param {string} activeLabel - label of the currently active nav item
 */
function renderSidebar(items, activeLabel) {
  const navLinks = items
    .map(item => {
      const activeClass = item.label === activeLabel ? ' active' : '';
      return `
   <a href="${item.href}" class="nav-item${activeClass}">
    <span class="nav-icon">${item.icon}</span>
    ${item.label}
   </a>`;
    })
    .join('');

  return `
 <aside class="sidebar">
  <div class="logo">
   🚗 Road<span>Ready</span>
  </div>
  ${navLinks}
 </aside>`;
}

// Default nav items used across every page of the app.
const DEFAULT_NAV_ITEMS = [
  { href: '#', icon: '▦', label: 'Dashboard' },
  { href: '#', icon: '🔧', label: 'Maintenance' },
  { href: '#', icon: '🚘', label: 'My Vehicle' },
  { href: '#', icon: '🔔', label: 'Reminders' },
  { href: '#', icon: '📖', label: 'Maintenance Guide' }
];

/* ---------- TOPBAR ---------- */

/**
 * @param {{title: string, subtitle: string, userName: string}} config
 */
function renderTopbar({ title, subtitle, userName }) {
  return `
   <div class="topbar">
    <div>
     <h1>${title}</h1>
     <p>${subtitle}</p>
    </div>
    <div class="profile">
     👤 ${userName}
    </div>
   </div>`;
}

/* ---------- VEHICLE CARD ---------- */

/**
 * @param {{title: string, details: string, mileageLabel: string, imageSrc: string, imageAlt: string}} config
 */
function renderVehicleCard({ title, details, mileageLabel, imageSrc, imageAlt }) {
  return `
  <section class="vehicle-card">
   <div class="vehicle-info">
    <h2>${title}</h2>
    <p>${details}</p>
    <span class="mileage">${mileageLabel}</span>
   </div>
   <div class="car-image">
    <img src="${imageSrc}" alt="${imageAlt}">
   </div>
  </section>`;
}

/* ---------- STAT CARDS ---------- */

/**
 * @param {{label: string, number: string, sub: string}} stat
 */
function renderStatCard({ label, number, sub }) {
  return `
   <div class="stat-card">
    <div class="stat-label">${label}</div>
    <div class="stat-number">${number}</div>
    <div class="stat-sub">${sub}</div>
   </div>`;
}

/**
 * @param {Array<{label: string, number: string, sub: string}>} stats
 */
function renderStats(stats) {
  return `
  <section class="stats">
   ${stats.map(renderStatCard).join('')}
  </section>`;
}

/* ---------- MAINTENANCE ITEMS ---------- */

/**
 * status: 'soon' | 'good' | 'overdue' -> maps to CSS class + label
 */
const STATUS_LABELS = {
  soon: 'DUE SOON',
  good: 'UPCOMING',
  overdue: 'OVERDUE'
};

/**
 * @param {{name: string, detail: string, status: 'soon'|'good'|'overdue'}} item
 */
function renderMaintenanceItem({ name, detail, status }) {
  const label = STATUS_LABELS[status] || status.toUpperCase();
  return `
    <div class="maintenance-item">
     <div>
      <div class="service-name">${name}</div>
      <div class="service-detail">${detail}</div>
     </div>
     <span class="status ${status}">${label}</span>
    </div>`;
}

/**
 * @param {Array<{name: string, detail: string, status: string}>} items
 */
function renderMaintenanceList(items) {
  return items.map(renderMaintenanceItem).join('');
}

/* ---------- HISTORY TABLE ---------- */

/**
 * @param {{service: string, mileage: string, cost: string}} row
 */
function renderHistoryRow({ service, mileage, cost }) {
  return `
      <tr>
       <td>${service}</td>
       <td>${mileage}</td>
       <td>${cost}</td>
      </tr>`;
}

/**
 * @param {Array<{service: string, mileage: string, cost: string}>} rows
 */
function renderHistoryTable(rows) {
  return `
    <table>
     <thead>
      <tr>
       <th>Service</th>
       <th>Mileage</th>
       <th>Cost</th>
      </tr>
     </thead>
     <tbody>
      ${rows.map(renderHistoryRow).join('')}
     </tbody>
    </table>`;
}

/* ---------- PANEL WRAPPER ---------- */

/**
 * @param {{title: string, viewAllHref?: string, bodyHtml: string, footerHtml?: string}} config
 */
function renderPanel({ title, viewAllHref = '#', bodyHtml, footerHtml = '' }) {
  return `
   <div class="panel">
    <div class="panel-header">
     <h2>${title}</h2>
     <a href="${viewAllHref}" class="view-link">View all</a>
    </div>
    ${bodyHtml}
    ${footerHtml}
   </div>`;
}
