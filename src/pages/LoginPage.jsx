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

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) {
          setMessage(error.message)
          setIsError(true)
        } else {
          setMessage('Tapos na! Pwede ka nang mag-login! ✅')
          setIsError(false)
          setIsSignUp(false)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setMessage(error.message)
          setIsError(true)
        }
      }
    } catch (err) {
      setMessage('May problema! Subukan ulit. 😥')
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏪</div>
          <h1 className="text-2xl font-bold text-green-600">Utang Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">I-track ang utang ng iyong mga suki!</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setIsSignUp(false); setMessage('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isSignUp ? 'bg-white text-green-600 shadow' : 'text-gray-500'}`}
          >
            Mag-Login
          </button>
          <button
            onClick={() => { setIsSignUp(true); setMessage('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isSignUp ? 'bg-white text-green-600 shadow' : 'text-gray-500'}`}
          >
            Mag-Sign Up
          </button>
        </div>

        {/* Fields */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="email@example.com"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="••••••••"
          />
        </div>

        {/* Message */}
        {message && (
          <p className={`text-sm mb-4 text-center ${isError ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-400 hover:bg-green-500 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all"
        >
          {loading ? 'Loading...' : isSignUp ? 'Mag-Sign Up' : 'Mag-Login'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          {isSignUp ? 'May account ka na? ' : 'Wala pang account? '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
            className="text-green-500 font-medium"
          >
            {isSignUp ? 'Mag-login' : 'Mag-sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
