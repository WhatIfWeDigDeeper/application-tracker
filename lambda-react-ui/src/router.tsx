import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';

const ListPage = lazy(() => import('@/pages/ListPage'));
const ApplicationEditPage = lazy(() => import('@/pages/ApplicationEditPage'));

function Loading() {
  return <div style={{ padding: '1rem' }}>Loading...</div>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <ListPage />
          </Suspense>
        ),
      },
      {
        path: 'applications/new',
        element: (
          <Suspense fallback={<Loading />}>
            <ApplicationEditPage />
          </Suspense>
        ),
      },
      {
        path: 'applications/:id',
        element: (
          <Suspense fallback={<Loading />}>
            <ApplicationEditPage />
          </Suspense>
        ),
      },
    ],
  },
]);
