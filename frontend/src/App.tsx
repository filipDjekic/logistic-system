import { RouterProvider } from 'react-router-dom';
import AppProviders from './app/providers/AppProviders';
import { router } from './app/router';
import AppErrorBoundary from './app/errors/AppErrorBoundary';

function App() {
  return (
    <AppProviders>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
    </AppProviders>
  );
}

export default App;
