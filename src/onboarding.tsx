import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

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
              <input type="text" name="username" placeholder={usernamePlaceholder} autoComplete={usernameAutoComplete} />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                autoComplete={showNameField ? 'new-password' : 'current-password'}
              />
            </label>
            <button className="primary-button" type="submit">
              {actionLabel}
              <ArrowRight size={18} />
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
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('username') ?? '').trim()
    const password = String(formData.get('password') ?? '').trim()

    if (username === 'Prajesh' && password === 'Prajesh') {
      setError('')
      navigate('/dashboard', { replace: true })
      return
    }

    setError('Invalid username or password.')
  }

  return (
    <AuthShell
      heading="Sign in"
      text="Enter your credentials to access your workspace."
      actionLabel="Sign in"
      footerText="New here?"
      footerLink={{ href: '/signup', label: 'Create an account' }}
      usernameLabel="Username"
      usernamePlaceholder="Prajesh"
      usernameAutoComplete="username"
      submitError={error}
      onSubmit={handleSubmit}
    />
  )
}

export function SignUpPage() {
  return (
    <AuthShell
      heading="Sign up"
      text="Create an account for your lending team."
      actionLabel="Create account"
      footerText="Already have an account?"
      footerLink={{ href: '/signin', label: 'Continue to sign in' }}
      showNameField
      onSubmit={(event) => event.preventDefault()}
    />
  )
}
