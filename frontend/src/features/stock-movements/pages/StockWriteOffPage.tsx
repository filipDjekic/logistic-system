import { Navigate } from 'react-router-dom';

export default function LegacyStockOperationRedirectPage() {
  return <Navigate to="/stock-movements/create" replace />;
}
