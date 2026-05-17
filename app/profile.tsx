import SignOutButton from '@/components/auth/sign-out-button'
import { View, Text } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/hooks/use-auth-context'

export default function Profile() {
    const { claims } = useAuthContext()

    return (
        <View>
            <Text>Hola {claims?.user_metadata?.username}!</Text>
            <SignOutButton />
        </View>
    )
}