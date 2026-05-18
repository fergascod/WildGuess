import SignOutButton from '@/components/auth/sign-out-button'
import { useAuthContext } from '@/hooks/use-auth-context'
import { Redirect } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { colors, spacing } from '@/theme/theme'

export default function Profile() {
    const { claims, profile, isLoading, isLoggedIn } = useAuthContext()

    if (isLoading) return null
    if (!isLoggedIn) return <Redirect href="/login" />

    const username =
        profile?.username ?? claims?.user_metadata?.username ?? claims?.email

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Hola {username}!</Text>
            {claims?.email && <Text style={styles.email}>{claims.email}</Text>}
            <View style={styles.actions}>
                <SignOutButton />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.xl,
        gap: spacing.md,
    },
    heading: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    email: {
        fontSize: 14,
        color: colors.muted,
    },
    actions: {
        marginTop: spacing.lg,
    },
})
