import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { toApiError } from '../api/client'
import GoogleButton from './GoogleButton'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setFormError(null)
    setIsSubmitting(true)

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      navigate('/library', { replace: true })
    } catch (err) {
      const apiError = toApiError(err)
      if (apiError.errors) {
        setErrors(apiError.errors)
      } else {
        setFormError(apiError.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Create an account</h1>

        {formError && <p className="form-error">{formError}</p>}

        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          {errors.name && <span className="field-error">{errors.name[0]}</span>}
        </label>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {errors.email && <span className="field-error">{errors.email[0]}</span>}
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {errors.password && <span className="field-error">{errors.password[0]}</span>}
        </label>

        <label>
          Confirm password
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Register'}
        </button>

        <div className="auth-divider">or</div>

        <GoogleButton />

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
