/**
 * RoadReady component library.
 * Kept for compatibility with the original frontend.
 * The PHP pages now render their repeated components server-side.
 */

function renderSidebar(items, activeLabel) {
  const navLinks = items.map(item => {
    const activeClass = item.label === activeLabel ? ' active' : '';
    return `
      <a href="${item.href}" class="nav-item${activeClass}">
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
      </a>`;
  }).join('');

  return `
    <aside class="sidebar">
      <div class="logo">🚗 Road<span>Ready</span></div>
      ${navLinks}
    </aside>`;
}

const DEFAULT_NAV_ITEMS = [
  { href: 'dashboard.php', icon: '▦', label: 'Dashboard' },
  { href: 'maintenance.php', icon: '🔧', label: 'Maintenance' },
  { href: 'vehicle.php', icon: '🚘', label: 'My Vehicle' },
  { href: '#', icon: '🔔', label: 'Reminders' },
  { href: 'maintenance_guide.php', icon: '📖', label: 'Maintenance Guide' }
];

function renderTopbar({ title, subtitle, userName }) {
  return `
    <div class="topbar">
      <div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="profile">👤 ${userName}</div>
    </div>`;
}

function renderVehicleCard({ title, details, mileageLabel, imageSrc, imageAlt }) {
  return `
    <section class="vehicle-card">
      <div class="vehicle-info">
        <h2>${title}</h2>
        <p>${details}</p>
        <span class="mileage">${mileageLabel}</span>
      </div>
      <div class="car-image">
        <img src="${imageSrc}" alt="${imageAlt || 'Vehicle'}">
      </div>
    </section>`;
}

function renderStatCard({ label, number, sub }) {
  return `
    <div class="stat-card">
      <div class="stat-label">${label}</div>
      <div class="stat-number">${number}</div>
      <div class="stat-sub">${sub}</div>
    </div>`;
}

function renderStats(stats) {
  return `<section class="stats">${stats.map(renderStatCard).join('')}</section>`;
}

const STATUS_LABELS = {
  soon: 'DUE SOON',
  good: 'UPCOMING',
  overdue: 'OVERDUE'
};

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

function renderMaintenanceList(items) {
  return items.map(renderMaintenanceItem).join('');
}

function renderHistoryRow({ service, mileage, cost }) {
  return `
    <tr>
      <td>${service}</td>
      <td>${mileage}</td>
      <td>${cost}</td>
    </tr>`;
}

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
      <tbody>${rows.map(renderHistoryRow).join('')}</tbody>
    </table>`;
}

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
