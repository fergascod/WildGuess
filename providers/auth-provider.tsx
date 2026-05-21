import { AuthContext } from '@/hooks/use-auth-context'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { PropsWithChildren, useEffect, useState } from 'react'

export default function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<User | null | undefined>(
        isSupabaseConfigured ? undefined : null
    )
    const [profile, setProfile] = useState<any>(null)
    const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured)

    useEffect(() => {
        if (!isSupabaseConfigured) return

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setIsLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: string, session: Session | null) => {
                setUser(session?.user ?? null)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (user === undefined) return

        if (!user) {
            setProfile(null)
            return
        }

        let cancelled = false
        supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data, error }) => {
                if (cancelled) return
                if (error) console.warn('profile fetch failed', error.message)
                setProfile(data ?? null)
            })

        return () => {
            cancelled = true
        }
    }, [user])

    return (
        <AuthContext.Provider
            value={{
                claims: user,
                isLoading,
                profile,
                isLoggedIn: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
