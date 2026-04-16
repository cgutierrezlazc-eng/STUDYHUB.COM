// ═══════════════════════════════════════════════════════════════
// PASSIVE INTERCEPTOR — Script que corre en el MAIN WORLD
// Se carga como web_accessible_resource (no inline) para cumplir CSP
// Intercepta fetch/XHR de Moodle y envia datos via postMessage
// ═══════════════════════════════════════════════════════════════

(function passiveInterceptor() {
  if ((window as any).__conniku_passive) return;
  (window as any).__conniku_passive = true;

  const origFetch = window.fetch.bind(window);
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : (input as Request)?.url;

    const result = origFetch(input, init);

    if (url?.includes('/lib/ajax/service.php')) {
      result.then((response) => {
        const clone = response.clone();
        clone.json().then((data) => {
          const body = init?.body;
          if (!body || typeof body !== 'string') return;
          try {
            const requests = JSON.parse(body);
            if (!Array.isArray(requests)) return;
            requests.forEach((req: { methodname: string; args: unknown }, i: number) => {
              if (data[i] && !data[i].error && data[i].data !== undefined) {
                window.postMessage({
                  type: 'CONNIKU_PASSIVE_AJAX',
                  methodname: req.methodname,
                  args: req.args,
                  response: data[i].data,
                }, window.location.origin);
              }
            });
          } catch { /* parse error */ }
        }).catch(() => {});
      }).catch(() => {});
    }

    return result;
  } as typeof fetch;

  const origXHRSend = XMLHttpRequest.prototype.send;
  const origXHROpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
    (this as any)._conniku_url = typeof url === 'string' ? url : url.toString();
    return origXHROpen.call(this, method, url, async ?? true, user, password);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    this.addEventListener('load', function () {
      const url = (this as any)._conniku_url;
      if (!url || !url.includes('/lib/ajax/service.php')) return;
      try {
        const data = JSON.parse(this.responseText);
        const requests = body && typeof body === 'string' ? JSON.parse(body) : [];
        if (!Array.isArray(requests)) return;
        requests.forEach((req: { methodname: string; args: unknown }, i: number) => {
          if (data[i] && !data[i].error && data[i].data !== undefined) {
            window.postMessage({
              type: 'CONNIKU_PASSIVE_AJAX',
              methodname: req.methodname,
              args: req.args,
              response: data[i].data,
            }, window.location.origin);
          }
        });
      } catch { /* parse error */ }
    });
    return origXHRSend.call(this, body);
  };
})();
