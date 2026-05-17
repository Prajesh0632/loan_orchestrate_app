import { useState, type FormEvent, useEffect } from 'react'
import { ArrowRight, Loader } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {loginUser,signupUser} from './api/auth_api'

type AuthShellProps = {
  heading: string
  text: string
  actionLabel: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  footerLink: { href: string; label: string }
  footerText: string
  showNameField?: boolean
  usernameLabel?: string
  usernamePlaceholder?: string
  usernameAutoComplete?: string
  submitError?: string
  isLoading?: boolean
}

function AuthShell({
  heading,
  text,
  actionLabel,
  onSubmit,
  footerLink,
  footerText,
  showNameField = false,
  usernameLabel = 'Email',
  usernamePlaceholder = 'jane@company.com',
  usernameAutoComplete = 'email',
  submitError,
  isLoading = false,
}: AuthShellProps) {
  return (
    <div className="auth-page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <div className="brand-name">ACLO</div>
            <div className="brand-sub">Loan orchestration</div>
          </div>
        </div>

        <nav className="nav-links" aria-label="Authentication">
          <NavLink to="/signin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Sign in
          </NavLink>
          <NavLink to="/signup" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Sign up
          </NavLink>
        </nav>
      </header>

      <main className="auth-container">
        <section className="auth-panel" aria-labelledby="auth-heading">
          <p className="eyebrow">Account access</p>
          <h1 id="auth-heading">{heading}</h1>
          <p className="muted">{text}</p>

          <form className="auth-form" onSubmit={onSubmit}>
            {showNameField && (
              <label>
                <span>Name</span>
                <input type="text" name="name" placeholder="Jane Doe" autoComplete="name" />
              </label>
            )}
            <label>
              <span>{usernameLabel}</span>
              <input type="text" name="auth_username" placeholder={usernamePlaceholder} autoComplete={usernameAutoComplete} />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                name="auth_password"
                placeholder="Enter your password"
                autoComplete="off"
              />
            </label>
            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  {actionLabel}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {submitError ? (
            <p className="auth-error" role="alert">
              {submitError}
            </p>
          ) : null}

          <p className="muted auth-footer">
            {footerText} <Link to={footerLink.href}>{footerLink.label}</Link>
          </p>
        </section>
      </main>
    </div>
  )
}

export function SignInPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('auth_username') ?? '').trim()
    const password = String(formData.get('auth_password') ?? '').trim()

    try {
      // const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5173/api'
      const response = await loginUser({username,password})
      if(!response.status) {
        setError(response.message || 'Login failed')
        setLoading(false)
        return
      }
      setLoading(false)
      localStorage.setItem("access_token", response.access_token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError('Connection error. Please try again.')
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <AuthShell
      heading="Sign in"
      text="Enter your credentials to access your workspace."
      actionLabel="Sign in"
      footerText="New here?"
      footerLink={{ href: '/signup', label: 'Create an account' }}
      usernameLabel="Username"
      usernamePlaceholder="Username"
      usernameAutoComplete="off"
      submitError={error}
      isLoading={loading}
      onSubmit={handleSubmit}
    />
  )
}

export function SignUpPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('auth_username') ?? '').trim()
    const password = String(formData.get('auth_password') ?? '').trim()

    if (!username || !password) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    try {
      // const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const response = await signupUser({username,password})
      // const data = await response.json()
     if(!response.status) {
        setError(response.message)
        setLoading(false)
        return

      }
      setLoading(false)
      navigate('/signin', { replace: true })
    } catch (err) {
      setError('Connection error. Please try again.')
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <AuthShell
      heading="Sign up"
      text="Create an account for your lending team."
      actionLabel="Create account"
      footerText="Already have an account?"
      footerLink={{ href: '/signin', label: 'Continue to sign in' }}
      usernameLabel="Username"
      usernamePlaceholder="john_doe"
      usernameAutoComplete="username"
      submitError={error}
      isLoading={loading}
      onSubmit={handleSubmit}
    />
  )
}
