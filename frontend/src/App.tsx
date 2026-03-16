import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Analyze from './pages/Analyze'
import Generate from './pages/Generate'
import ContractView from './pages/ContractView'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/contracts/:contractId" element={<ContractView />} />
      </Routes>
    </Layout>
  )
}
