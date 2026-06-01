import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'

export default function SignOutButton() {
    const [loading, setLoading] = useState(false)
    const { t } = useTranslation()

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
            label={loading ? t('auth.signingOut') : t('auth.signOut')}
            onPress={handleSignOut}
            disabled={loading}
        />
    )
}