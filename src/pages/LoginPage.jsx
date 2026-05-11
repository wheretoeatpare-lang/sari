import { useState } from 'react'
import { supabase } from '../db/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleSubmit() {
    if (!email || !password) {
      setMessage('Lagyan mo ng email at password ha! 😅')
      setIsError(true)
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.message)
      setIsError(true)
    } else if (isSignUp) {
      setMessage('Tapos na! Pwede ka nang mag-login! ✅')
      setIsError(false)
      setIsSignUp(false)
    }

    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏪</div>
          <h1 className="text-2xl font-bold text-green-700">Utang Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">I-track ang utang ng iyong mga suki!</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setIsSignUp(false); setMessage('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              !isSignUp ? 'bg-white text-green-700 shadow' : 'text-gray-500'
            }`}
          >
            Mag-Login
          </button>
          <button
            onClick={() => { setIsSignUp(true); setMessage('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              isSignUp ? 'bg-white text-green-700 shadow' : 'text-gray-500'
            }`}
          >
            Mag-Sign Up
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input
              type="email"
              placeholder="ikaw@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm ${
            isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-3 rounded-xl font-semibold text-sm transition-all"
        >
          {loading ? 'Loading...' : isSignUp ? 'Gumawa ng Account' : 'Pumasok'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          {isSignUp ? 'May account ka na?' : 'Wala pang account?'}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
            className="text-green-600 font-semibold"
          >
            {isSignUp ? 'Mag-login' : 'Mag-sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
