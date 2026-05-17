import { ArrowRight, LayoutDashboard } from 'lucide-react'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { SignInPage, SignUpPage } from './onboarding'
import { HousingLoanFormPage } from './housing-loan-form'
import { LoanDocumentsPage } from './loan-documents'
import { useState,useEffect } from 'react'
import {getDashboard} from './api/dashboard_api'

function DashboardPage() {
const [data, setData] = useState(null)

  useEffect(() => {

    async function load() {
      try {
      const res = await getDashboard()
      setData(res)
    } catch (err) {
      console.error(err)
      setData(null)
    }
    }

    load()

  }, [])

  if (!data) return <h2>Loading...</h2>

  return (
    <div className="dashboard-page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <div className="brand-name">ACLO</div>
            <div className="brand-sub">Dashboard</div>
          </div>
        </div>

        <nav className="nav-links" aria-label="Dashboard">
          <span className="nav-link active">
            <LayoutDashboard size={16} />
            Dashboard
          </span>
        </nav>
      </header>

      <main className="dashboard-container">
        <section className="dashboard-hero dashboard-hero-center">
          <div>
            <p className="eyebrow">Signed in as {data?.username} </p>
            <h1>Operations dashboard</h1>
            <p className="muted">Continue by filling the form.</p>
          </div>

          <Link className="primary-button dashboard-action" to="/fill-form">
            Fill the form
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/fill-form" element={<HousingLoanFormPage />} />
        <Route path="/documents" element={<LoanDocumentsPage />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
