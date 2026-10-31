import { BRIDGE_PROTOCOL, BridgeCallError, type Bridge, type BridgeMethod, type CallOptions, type DetectedExtension, type HttpResponse, type ParamsOf, type ResultOf, type YtFetchParams } from '@bitchord/shared/bridge';

export const isTizenBuild = import.meta.env.MODE === 'tizen';

// The TV owns this transport. It does not claim a browser extension is installed,
// expose another device's cookies, or advertise authentication it cannot provide.
async function call<M extends BridgeMethod>(method: M, params: ParamsOf<M>, options?: CallOptions): Promise<ResultOf<M>> {
  let result: unknown;
  if (method === 'ping') {
    result = { version: '0.1.0', protocol: BRIDGE_PROTOCOL, browser: 'tizen', capabilities: ['yt'] };
  } else if (method === 'yt.fetch') {
    const request = params as YtFetchParams;
    const url = new URL(request.url);
    if (request.auth) throw new BridgeCallError('unsupported', 'O login do YouTube ainda não foi portado para o Tizen.');
    if (url.protocol !== 'https:' || url.hostname !== 'www.youtube.com' || !url.pathname.startsWith('/api/jnn/')) {
      throw new BridgeCallError('forbidden', 'Este endereço não faz parte do transporte de reprodução da TV.');
    }
    const controller = new AbortController();
    const abort = () => controller.abort(options?.signal?.reason);
    const timer = setTimeout(() => controller.abort(new DOMException('Tempo de conexão esgotado', 'TimeoutError')), options?.timeoutMs ?? 30_000);
    options?.signal?.addEventListener('abort', abort, { once: true });
    if (options?.signal?.aborted) abort();
    try {
      const headers = new Headers(request.headers);
      for (const key of ['cookie', 'authorization', 'origin', 'referer']) headers.delete(key);
      const body = request.bodyEncoding === 'base64' && request.body
        ? Uint8Array.from(atob(request.body), c => c.charCodeAt(0))
        : request.body;
      const response = await fetch(url, { method: request.method ?? 'GET', headers, body, credentials: 'omit', signal: controller.signal });
      const bytes = new Uint8Array(await response.arrayBuffer());
      const text = /json|text|javascript|xml/.test(response.headers.get('content-type') ?? '');
      let binary = '';
      if (!text) for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      result = {
        status: response.status, url: response.url, headers: Object.fromEntries(response.headers.entries()),
        bodyEncoding: text ? 'text' : 'base64', body: text ? new TextDecoder().decode(bytes) : btoa(binary),
      } satisfies HttpResponse;
    } finally {
      clearTimeout(timer);
      options?.signal?.removeEventListener('abort', abort);
    }
  } else {
    throw new BridgeCallError('unsupported', `O serviço ${method} ainda não está implementado diretamente no Tizen.`);
  }
  return result as ResultOf<M>;
}

const bridge: Bridge = { transport: 'tizen', call, subscribe: () => () => {} };
export async function tizenServices(): Promise<DetectedExtension> {
  return { bridge, info: await bridge.call('ping', {}) };
}
