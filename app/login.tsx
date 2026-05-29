
import { Link, Stack, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
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
    const { t } = useTranslation()
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
            <Stack.Screen options={{ title: t('login.title') }} />
            <Card style={styles.card}>


                <FormField label={t('login.email')} error={errors.email?.message}>
                    <Controller
                        control={control}
                        name="email"
                        rules={{
                            required: t('login.emailRequired'),
                            pattern: { value: /\S+@\S+\.\S+/, message: t('login.emailInvalid') },
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

                <FormField label={t('login.password')} error={errors.password?.message}>
                    <Controller
                        control={control}
                        name="password"
                        rules={{
                            required: t('login.passwordRequired'),
                            minLength: { value: 8, message: t('login.passwordMin') },
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
                    label={loading ? t('login.buttonLoading') : t('login.button')}
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                />

                <View style={styles.linkRow}>
                    <Text style={styles.linkHint}>{t('login.noAccount')}</Text>
                    <Link href="/signup" style={styles.linkText}>{t('login.signUp')}</Link>
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
