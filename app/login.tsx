
import { Link, Stack, useRouter } from 'expo-router'
import { StyleSheet, View, Text, TextInput } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useForm, Controller } from 'react-hook-form'
import { Button, Card, FormField, Screen, Title, styles as uiStyles } from '@/components/ui'
import { useState } from 'react'
import { colors, spacing } from '@/theme/theme'

type FormData = {
    email: string
    password: string
}

export default function LoginScreen() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: { email: '', password: '' },
    })

    async function onSubmit(data: FormData) {
        setLoading(true)
        setAuthError(null)
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        })
        setLoading(false)
        if (error) setAuthError(error.message)
        else router.replace('/')
    }

    return (
        <Screen contentStyle={styles.content}>
            <Stack.Screen options={{ title: 'Login' }} />
            <Card style={styles.card}>


                <FormField label="Email" error={errors.email?.message}>
                    <Controller
                        control={control}
                        name="email"
                        rules={{
                            required: 'Email is required',
                            pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={[uiStyles.input, errors.email && styles.inputError]}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />
                </FormField>

                <FormField label="Password" error={errors.password?.message}>
                    <Controller
                        control={control}
                        name="password"
                        rules={{
                            required: 'Password is required',
                            minLength: { value: 8, message: 'At least 8 characters' },
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={[uiStyles.input, errors.password && styles.inputError]}
                                secureTextEntry
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />
                </FormField>

                {authError && <Text style={styles.error}>{authError}</Text>}

                <Button
                    label={loading ? 'Logging in…' : 'Log in'}
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                />

                <View style={styles.linkRow}>
                    <Text style={styles.linkHint}>Encara no tens un compte?</Text>
                    <Link href="/signup" style={styles.linkText}>Dona't d'alta</Link>
                </View>
            </Card>
        </Screen>
    )
}

const styles = StyleSheet.create({
    content: {
        gap: spacing.xl,
    },
    card: {
        gap: spacing.lg,
    },
    header: {
        gap: spacing.xs,
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: colors.muted,
        textAlign: 'center',
    },
    inputError: {
        borderColor: colors.wrong,
    },
    error: {
        color: colors.wrong,
        fontSize: 12,
        textAlign: 'center',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    linkHint: {
        fontSize: 13,
        color: colors.muted,
    },
    linkText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.accent,
    },
})
