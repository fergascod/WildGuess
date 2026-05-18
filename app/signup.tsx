import { Link, Stack, useRouter } from 'expo-router'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useForm, Controller } from 'react-hook-form'
import { useState } from 'react'

type FormData = {
    email: string
    username: string
    password: string
}

export default function SignupScreen() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: { email: '', username: '', password: '' },
    })

    async function onSubmit(data: FormData) {
        setLoading(true)
        setAuthError(null)
        const { data: result, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: { username: data.username },
            },
        })
        setLoading(false)
        if (error) {
            setAuthError(error.message)
            return
        }
        if (result.session) router.replace('/')
        else setAuthError('Check your email to confirm your account.')
    }

    return (
        <>
            <Stack.Screen options={{ title: 'Sign Up' }} />
            <View style={styles.container}>
                <Text style={styles.title}>Create account</Text>

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

                {/* USERNAME */}
                <Text style={styles.label}>Username</Text>
                <Controller
                    control={control}
                    name="username"
                    rules={{
                        required: 'Username is required',
                        minLength: { value: 3, message: 'At least 3 characters' },
                        pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only' },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, errors.username && styles.inputError]}
                            placeholder="cool_username"
                            autoCapitalize="none"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                {errors.username && <Text style={styles.error}>{errors.username.message}</Text>}

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
                            placeholder="••••••••"
                            secureTextEntry
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

                {/* Supabase-level error (e.g. email already in use) */}
                {authError && <Text style={styles.error}>{authError}</Text>}

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.buttonText}>Sign up</Text>
                    }
                </TouchableOpacity>

                <Link href="/login" style={styles.loginLink}>
                    <Text style={styles.loginLinkText}>Already have an account? Log in</Text>
                </Link>
            </View>
        </>
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
    loginLink: {
        marginTop: 20,
        alignSelf: 'center',
    },
    loginLinkText: {
        color: '#555',
        fontSize: 14,
    },
})