// Sidebar + Layout generator

function buildLayout(role, activePage, contentHtml) {
  const user = getUser();
  
  const menus = {
    patient: [
      { icon: '🏠', label: 'Dashboard', href: '/patient/dashboard.html' },
      { icon: '🔍', label: 'Find Doctor', href: '/patient/find-doctor.html' },
      { icon: '📅', label: 'My Appointments', href: '/patient/appointments.html' },
      { icon: '💊', label: 'My Prescriptions', href: '/patient/prescriptions.html' },
      { icon: '📋', label: 'Health Records', href: '/patient/health-records.html' },
      { icon: '🚨', label: 'Emergency', href: '/patient/emergency.html', urgent: true },
      { icon: '🏥', label: 'Referral Status', href: '/patient/referrals.html' },
      { icon: '❓', label: 'Submit Issue', href: '/patient/issues.html' },
    ],
    doctor: [
      { icon: '🏠', label: 'Dashboard', href: '/doctor/dashboard.html' },
      { icon: '📅', label: 'My Schedule', href: '/doctor/schedule.html' },
      { icon: '✍️', label: 'Write Prescription', href: '/doctor/prescriptions.html' },
      { icon: '📋', label: 'Update Health Record', href: '/doctor/health-record.html' },
      { icon: '🚨', label: 'Emergency Alerts', href: '/doctor/emergencies.html', urgent: true },
      { icon: '🏥', label: 'Create Referral', href: '/doctor/referrals.html' },
      { icon: '❓', label: 'Patient Issues', href: '/doctor/issues.html' },
    ],
    admin: [
      { icon: '📊', label: 'Analytics', href: '/admin/dashboard.html' },
      { icon: '👨‍⚕️', label: 'Manage Doctors', href: '/admin/doctors.html' },
      { icon: '👥', label: 'Manage Patients', href: '/admin/patients.html' },
      { icon: '📅', label: 'All Appointments', href: '/admin/appointments.html' },
      { icon: '🚨', label: 'Emergency Queue', href: '/admin/emergencies.html', urgent: true },
      { icon: '🏥', label: 'Referrals', href: '/admin/referrals.html' },
      { icon: '❓', label: 'Issue Tracker', href: '/admin/issues.html' },
    ]
  };

  const navItems = menus[role] || [];
  const navHtml = navItems.map(item => `
    <a href="${item.href}" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
      ${activePage === item.href ? 'bg-teal-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
      ${item.urgent && activePage !== item.href ? 'border border-red-500/30' : ''}">
      <span class="text-xl">${item.icon}</span>
      <span class="font-medium text-sm">${item.label}</span>
      ${item.urgent && activePage !== item.href ? '<span class="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>' : ''}
    </a>
  `).join('');

  const roleColors = { patient: 'bg-emerald-500', doctor: 'bg-sky-500', admin: 'bg-violet-500' };
  const roleLabel = { patient: 'Patient', doctor: 'Doctor', admin: 'Admin' };

  return `
    <div class="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-slate-900 flex flex-col flex-shrink-0 h-full overflow-y-auto">
        <!-- Logo -->
        <div class="px-6 py-5 border-b border-slate-700">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center text-white text-lg">⚕</div>
            <div>
              <div class="text-white font-bold text-sm leading-tight">RuralMed</div>
              <div class="text-slate-400 text-xs">Telemedicine</div>
            </div>
          </div>
        </div>
        
        <!-- User Info -->
        <div class="px-4 py-4 border-b border-slate-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full ${roleColors[role]} flex items-center justify-center text-white font-bold text-lg">
              ${user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-white text-sm font-semibold truncate">${user?.name || 'User'}</div>
              <div class="text-slate-400 text-xs">${roleLabel[role]}</div>
            </div>
          </div>
        </div>
        
        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 space-y-1">
          ${navHtml}
        </nav>
        
        <!-- Logout -->
        <div class="px-3 py-4 border-t border-slate-700">
          <button onclick="logout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
            <span class="text-xl">🚪</span>
            <span class="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        ${contentHtml}
      </main>
    </div>
  `;
}

function pageHeader(title, subtitle, actions = '') {
  return `
    <div class="flex items-start justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">${title}</h1>
        ${subtitle ? `<p class="text-slate-500 mt-1">${subtitle}</p>` : ''}
      </div>
      ${actions ? `<div class="flex gap-3">${actions}</div>` : ''}
    </div>
  `;
}

function card(content, extraClass = '') {
  return `<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${extraClass}">${content}</div>`;
}

function statCard(icon, value, label, color = 'teal') {
  const colors = {
    teal: 'bg-teal-50 text-teal-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  };
  return `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
      <div class="w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">${icon}</div>
      <div>
        <div class="text-3xl font-bold text-slate-800">${value}</div>
        <div class="text-sm text-slate-500 mt-0.5">${label}</div>
      </div>
    </div>
  `;
}

function tableWrapper(headers, rows, emptyMsg = 'No data found') {
  if (!rows || rows.length === 0) return emptyState(emptyMsg);
  return `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100">
            ${headers.map(h => `<th class="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function btn(label, onclick, variant = 'primary', size = 'md') {
  const variants = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    sky: 'bg-sky-500 hover:bg-sky-600 text-white'
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return `<button onclick="${onclick}" class="${variants[variant]} ${sizes[size]} rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md">${label}</button>`;
}

// Modal utility
function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }
function modalWrapper(id, title, content) {
  return `
    <div id="${id}" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-800">${title}</h3>
          <button onclick="closeModal('${id}')" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
        </div>
        <div class="px-6 py-5">${content}</div>
      </div>
    </div>
  `;
}

function inputField(label, id, type = 'text', placeholder = '', required = false, extra = '') {
  return `
    <div class="space-y-1.5">
      <label class="text-sm font-semibold text-slate-700">${label}${required ? ' <span class="text-red-500">*</span>' : ''}</label>
      <input id="${id}" type="${type}" placeholder="${placeholder}" ${required ? 'required' : ''} ${extra}
        class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
    </div>
  `;
}

function selectField(label, id, options, required = false) {
  const opts = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  return `
    <div class="space-y-1.5">
      <label class="text-sm font-semibold text-slate-700">${label}${required ? ' <span class="text-red-500">*</span>' : ''}</label>
      <select id="${id}" ${required ? 'required' : ''}
        class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white">
        <option value="">Select ${label}</option>
        ${opts}
      </select>
    </div>
  `;
}

function textareaField(label, id, placeholder = '', rows = 3) {
  return `
    <div class="space-y-1.5">
      <label class="text-sm font-semibold text-slate-700">${label}</label>
      <textarea id="${id}" rows="${rows}" placeholder="${placeholder}"
        class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"></textarea>
    </div>
  `;
}
