import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { api, ApiError, errorText } from '../api'
import { buttonClass, inputClass, labelClass } from '../components'
import { useAuth } from '../useAuth'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const auth = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<{ token: string }>(`/api/auth/${mode}`, { body }),
    onSuccess: ({ token }) => {
      signIn(token)
      navigate(from, { replace: true })
    },
  })

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    auth.mutate({ email: String(form.get('email')), password: String(form.get('password')) })
  }

  const register = mode === 'register'
  const error =
    auth.error instanceof ApiError && auth.error.status === 401
      ? 'Invalid email or password.'
      : auth.error && errorText(auth.error, 'That email is already registered. Sign in instead.')

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">{register ? 'Create an account' : 'Sign in'}</h1>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required maxLength={255} className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            required
            minLength={8}
            maxLength={72}
            aria-describedby="password-hint"
            className={inputClass}
          />
          <p id="password-hint" className="mt-1 text-xs text-stone-600">At least 8 characters.</p>
        </div>
        {error && <p role="alert" className="text-sm font-medium text-red-800">{error}</p>}
        <button type="submit" disabled={auth.isPending} className={`${buttonClass} w-full`}>
          {register ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        {register ? 'Already have an account?' : 'New to OpenCamp?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(register ? 'login' : 'register')
            auth.reset()
          }}
          className="font-semibold text-emerald-900 underline"
        >
          {register ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </div>
  )
}
