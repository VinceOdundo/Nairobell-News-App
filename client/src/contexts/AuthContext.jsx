import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentUser, getUserProfile } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateProfile: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getCurrentUser().then(user => {
      setUser(user)
      if (user) {
        getUserProfile(user.id).then(profile => {
          setProfile(profile)
        }).catch(console.error)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const profile = await getUserProfile(session.user.id)
            setProfile(profile)
          } catch (error) {
            console.error('Error fetching profile:', error)
          }
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({ email, password, firstName, lastName, username, country = 'Kenya' }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            username,
            country
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email,
              username,
              first_name: firstName,
              last_name: lastName,
              country,
              preferred_language: 'en'
            }
          ])

        if (profileError) throw profileError

        // Create default preferences
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .insert([
            {
              user_id: data.user.id,
              preferred_countries: [country],
              preferred_categories: ['politics', 'business', 'technology'],
              preferred_languages: ['en']
            }
          ])

        if (prefsError) throw prefsError

        toast.success('Account created successfully!')
      }

      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      toast.success('Welcome back!')
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setProfile(null)
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Error signing out')
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      toast.success('Profile updated successfully!')
      return { data, error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}