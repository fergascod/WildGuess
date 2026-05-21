import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Button } from '@/components/ui'

export default function SignOutButton() {
    const [loading, setLoading] = useState(false)

    async function handleSignOut() {
        setLoading(true)
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Error signing out:', error)
            setLoading(false)
        }
    }

    return (
        <Button
            label={loading ? 'Signing out…' : 'Sign out'}
            onPress={handleSignOut}
            disabled={loading}
        />
    )
}