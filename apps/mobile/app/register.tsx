import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@stannel/types';
import GlassCard from '@/components/GlassCard';

function translateFirebaseError(code: string): string {
  const errors: Record<string, string> = {
    'auth/email-already-in-use': 'כתובת האימייל כבר רשומה במערכת',
    'auth/invalid-email': 'כתובת אימייל לא תקינה',
    'auth/weak-password': 'הסיסמה חלשה מדי. נדרשים לפחות 6 תווים',
    'auth/network-request-failed': 'בעיית תקשורת. בדוק את החיבור לאינטרנט.',
    'auth/too-many-requests': 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.',
  };
  return errors[code] || 'שגיאה בהרשמה. נסה שוב.';
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ARCHITECT);
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('נא למלא את כל שדות החובה');
      return;
    }
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    if (role === UserRole.SUPPLIER && !companyName.trim()) {
      setError('נא להזין שם חברה');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim() || undefined,
        role,
        companyName: role === UserRole.SUPPLIER ? companyName.trim() : undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      const code = err?.code || err?.message || '';
      setError(translateFirebaseError(code));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <GlassCard style={styles.successCard}>
            <LinearGradient
              colors={['#d4af37', '#f5d77e']}
              style={styles.successIcon}
            >
              <MaterialCommunityIcons name="check" size={40} color="#1a3a6b" />
            </LinearGradient>
            <Text style={styles.successTitle}>ההרשמה הצליחה!</Text>
            <Text style={styles.successText}>
              החשבון שלך ממתין לאישור מנהל. נודיע לך ברגע שהחשבון יאושר.
            </Text>
            <Pressable
              style={styles.backBtn}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.backBtnText}>חזרה להתחברות</Text>
            </Pressable>
          </GlassCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backArrow}>
              <MaterialCommunityIcons name="arrow-right" size={24} color="white" />
            </Pressable>
            <Text style={styles.headerTitle}>הרשמה</Text>
            <View style={{ width: 24 }} />
          </View>

          <GlassCard style={styles.formCard}>
            {error && (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Role Toggle */}
            <View style={styles.roleToggle}>
              <Pressable
                style={[styles.roleBtn, role === UserRole.ARCHITECT && styles.roleBtnActive]}
                onPress={() => setRole(UserRole.ARCHITECT)}
              >
                <Text style={[styles.roleBtnText, role === UserRole.ARCHITECT && styles.roleBtnTextActive]}>
                  אדריכל
                </Text>
              </Pressable>
              <Pressable
                style={[styles.roleBtn, role === UserRole.DESIGNER && styles.roleBtnActive]}
                onPress={() => setRole(UserRole.DESIGNER)}
              >
                <Text style={[styles.roleBtnText, role === UserRole.DESIGNER && styles.roleBtnTextActive]}>
                  מעצב
                </Text>
              </Pressable>
              <Pressable
                style={[styles.roleBtn, role === UserRole.SUPPLIER && styles.roleBtnActive]}
                onPress={() => setRole(UserRole.SUPPLIER)}
              >
                <Text style={[styles.roleBtnText, role === UserRole.SUPPLIER && styles.roleBtnTextActive]}>
                  ספק
                </Text>
              </Pressable>
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>שם מלא *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={20} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.input}
                  placeholder="השם שלך"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={name}
                  onChangeText={setName}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>אימייל *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={20} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="left"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>טלפון</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="phone-outline" size={20} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.input}
                  placeholder="050-1234567"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  textAlign="left"
                />
              </View>
            </View>

            {/* Company Name (Supplier only) */}
            {role === UserRole.SUPPLIER && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>שם חברה *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="domain" size={20} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.input}
                    placeholder="שם החברה"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={companyName}
                    onChangeText={setCompanyName}
                    textAlign="right"
                  />
                </View>
              </View>
            )}

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>סיסמה *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.input}
                  placeholder="לפחות 6 תווים"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="rgba(255,255,255,0.4)"
                  />
                </Pressable>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>אישור סיסמה *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.input}
                  placeholder="הזן סיסמה שוב"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
              </View>
            </View>

            <Pressable
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#060f1f" />
              ) : (
                <Text style={styles.registerBtnText}>הירשם</Text>
              )}
            </Pressable>
          </GlassCard>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>כבר יש לך חשבון? </Text>
            <Pressable onPress={() => router.replace('/login')}>
              <Text style={styles.loginLink}>התחבר</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backArrow: {
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  formCard: {
    padding: 24,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: '#d4af37',
  },
  roleBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: '#060f1f',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  registerBtn: {
    backgroundColor: '#d4af37',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerBtnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: '#060f1f',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  loginLink: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    padding: 32,
    alignItems: 'center',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    color: '#d4af37',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  successText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
