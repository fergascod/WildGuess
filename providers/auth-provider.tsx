import { AuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase'
import { PropsWithChildren, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'

export default function AuthProvider({ children }: PropsWithChildren) {
    const [claims, setClaims] = useState<Record<string, any> | undefined | null>()
    const [profile, setProfile] = useState<any>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const router = useRouter()

    useEffect(() => {
        // 1. Fetch the current session once on mount
        const initAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setClaims(user ?? null)
            setIsLoading(false)
        }

        initAuth()

        // 2. Single subscription — handles all auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setClaims(session?.user ?? null)

                if (_event === 'SIGNED_OUT') {
                    setProfile(null)
                    router.replace('/')
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    // Fetch profile whenever claims change
    useEffect(() => {
        if (claims === undefined) return // still initialising, don't run yet

        const fetchProfile = async () => {
            if (claims) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', claims.id) // user.id, not claims.sub
                    .single()
                setProfile(data)
            } else {
                setProfile(null)
            }
        }

        fetchProfile()
    }, [claims])

    return (
        <AuthContext.Provider
            value={{
                claims,
                isLoading,
                profile,
                isLoggedIn: claims != null,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}