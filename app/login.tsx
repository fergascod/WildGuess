
import { Link, Stack, useRouter } from 'expo-router'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useForm, Controller } from 'react-hook-form'
import { Screen } from '@/components/ui'
import { useState } from 'react'

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
        <Screen>
            <Stack.Screen options={{ title: 'Login' }} />
            <View style={styles.container}>
                <Text style={styles.title}>Log in</Text>

                {/* EMAIL */}
                <Text style={styles.label}>Email</Text>
                <Controller
                    control={control}
                    name="email"
                    rules={{
                        required: 'Email is required',
                        pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="you@example.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

                {/* PASSWORD */}
                <Text style={styles.label}>Password</Text>
                <Controller
                    control={control}
                    name="password"
                    rules={{
                        required: 'Password is required',
                        minLength: { value: 8, message: 'At least 8 characters' },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, errors.password && styles.inputError]}
                            secureTextEntry
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

                {/* Supabase-level error */}
                {authError && <Text style={styles.error}>{authError}</Text>}

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.buttonText}>Log in</Text>
                    }
                </TouchableOpacity>

                <Link href="/signup" style={styles.signupLink}>
                    <Text style={styles.signupLinkText}>Don't have an account? Sign up</Text>
                </Link>
            </View>
        </Screen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#e53e3e',
    },
    error: {
        color: '#e53e3e',
        fontSize: 12,
        marginTop: 4,
    },
    button: {
        backgroundColor: '#000',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 28,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    signupLink: {
        marginTop: 20,
        alignSelf: 'center',
    },
    signupLinkText: {
        color: '#555',
        fontSize: 14,
    },
})
