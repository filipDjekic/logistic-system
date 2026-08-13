import { RouterProvider } from 'react-router-dom';
import AppProviders from './app/providers/AppProviders';
import { router } from './app/router';
import AppErrorBoundary from './app/errors/AppErrorBoundary';

function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  );
}

export default App;
