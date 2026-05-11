import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import StatusBar from './components/StatusBar'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Transactions from './pages/Transactions'
import LoginPage from './pages/LoginPage'

export default function App() {
  const { user, loading } = useAuth()

  // Still checking if logged in
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="text-4xl mb-3">🏪</div>
          <p className="text-green-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in — show login page
  if (!user) {
    return <LoginPage />
  }

  // Logged in — show the app
  return (
    <div className="min-h-screen bg-gray-50">
      <StatusBar />
      <Toast />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
