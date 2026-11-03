import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router';
import { queryClient } from '@/lib/queryClient';
import { routes } from '@/routes';
import '@/styles/global.css';
import '@/platform/tizen/tv.css';

if (import.meta.env.MODE === 'tizen') document.documentElement.classList.add('tizen-tv');

// Packaged TV apps have no HTTP server to resolve browser-history paths.
const router = import.meta.env.MODE === 'tizen' ? createHashRouter(routes) : createBrowserRouter(routes);

async function mount() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('tv-preview') === '1') {
    const { prepareTvPreview } = await import('@/platform/tizen/devPreview');
    prepareTvPreview();
  }
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

}
void mount();
