(function () {
  var MODULES = [
    { id: 'workspaces', href: 'workspaces.html', label: 'Workspaces', r: 107, g: 78, b: 255,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>' },
    { id: 'mensajes', href: 'mensajes.html', label: 'Mensajes', r: 0, g: 194, b: 122,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' },
    { id: 'biblioteca', href: 'biblioteca.html', label: 'Biblioteca', r: 196, g: 154, b: 58,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>' },
    { id: 'cursos', href: 'cursos.html', label: 'Cursos', r: 168, g: 200, b: 0,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' },
    { id: 'chat', href: 'chat.html', label: 'Comunidades', r: 0, g: 150, b: 204,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>' },
    { id: 'calendario', href: 'calendario.html', label: 'Calendario', r: 176, g: 173, b: 164,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' },
    { id: 'tutores', href: 'tutores.html', label: 'Tutores', r: 204, g: 61, b: 42,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M17 13l2 2 4-4"/></svg>' },
    { id: 'empleo', href: 'empleo.html', label: 'Empleo', r: 0, g: 160, b: 104,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>' },
    { id: 'athena', href: 'athena.html', label: 'Athena IA', r: 124, g: 58, b: 237,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>' },
  ];

  var page = location.pathname.split('/').pop() || '';
  var active = MODULES.find(function (m) { return m.href === page; });
  if (active) {
    document.documentElement.style.setProperty('--sb-r', active.r);
    document.documentElement.style.setProperty('--sb-g', active.g);
    document.documentElement.style.setProperty('--sb-b', active.b);
    document.documentElement.style.setProperty('--sb-accent', 'rgb(' + active.r + ',' + active.g + ',' + active.b + ')');
  }

  var links = MODULES.map(function (m) {
    var cls = 'sb-link' + (m.href === page ? ' active' : '');
    return '<a href="' + m.href + '" class="' + cls + '" aria-label="' + m.label + '">' + m.icon + '</a>';
  }).join('');

  var html = '<nav class="mod-sidebar">'
    + '<a href="orbit-u.html" class="sb-link sb-home" aria-label="Orbit·U"><span class="sb-sol"></span></a>'
    + '<div class="sb-sep"></div>'
    + links
    + '<div class="sb-sep" style="margin-top:auto"></div>'
    + '<a href="perfil.html" class="sb-link sb-av" aria-label="Mi perfil">CG</a>'
    + '</nav>';

  document.body.insertAdjacentHTML('afterbegin', html);

  var el = document.querySelector('.page, .layout, .ws-layout, .msg-layout, .chat-layout');
  if (el) el.style.marginLeft = '52px';
})();
