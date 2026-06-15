import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '@/components/GlassCard';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-right" size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>אודות</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo & App Info */}
        <GlassCard style={styles.logoCard}>
          <LinearGradient
            colors={['#d4af37', '#f5d77e']}
            style={styles.logoBox}
          >
            <Text style={styles.logoLetter}>S</Text>
          </LinearGradient>
          <Text style={styles.appName}>STANNEL</Text>
          <Text style={styles.version}>גרסה 1.0.0</Text>
          <Text style={styles.tagline}>מועדון הנאמנות המוביל לאדריכלים ומעצבים</Text>
        </GlassCard>

        {/* About */}
        <GlassCard style={styles.contentCard}>
          <Text style={styles.sectionTitle}>מי אנחנו</Text>
          <Text style={styles.text}>
            STANNEL היא פלטפורמת נאמנות חדשנית המחברת בין אדריכלים ומעצבים לבין ספקים מובילים
            בתעשיית הבנייה והעיצוב. באמצעות המערכת, אדריכלים צוברים נקודות על רכישות ומממשים
            אותן להטבות בלעדיות.
          </Text>
        </GlassCard>

        <GlassCard style={styles.contentCard}>
          <Text style={styles.sectionTitle}>איך זה עובד</Text>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>מעלים חשבונית מספק משתתף</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>מערכת AI מאמתת את החשבונית</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>נצברות נקודות אוטומטית</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>מממשים הטבות מחנות ההטבות</Text>
          </View>
        </GlassCard>

        {/* Contact */}
        <GlassCard style={styles.contentCard}>
          <Text style={styles.sectionTitle}>יצירת קשר</Text>
          <Pressable
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:support@stannel.co.il')}
          >
            <MaterialCommunityIcons name="email-outline" size={20} color="#d4af37" />
            <Text style={styles.contactText}>support@stannel.co.il</Text>
          </Pressable>
          <Pressable
            style={styles.contactItem}
            onPress={() => Linking.openURL('https://stannelclub.co.il')}
          >
            <MaterialCommunityIcons name="web" size={20} color="#d4af37" />
            <Text style={styles.contactText}>stannelclub.co.il</Text>
          </Pressable>
        </GlassCard>

        <Text style={styles.copyright}>© 2026 STANNEL. כל הזכויות שמורות.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 16,
  },
  logoCard: {
    padding: 32,
    alignItems: 'center',
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoLetter: {
    color: '#1a3a6b',
    fontSize: 36,
    fontWeight: 'bold',
  },
  appName: {
    color: '#d4af37',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  version: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 8,
  },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  contentCard: {
    padding: 24,
  },
  sectionTitle: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'right',
  },
  text: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  stepNumberText: {
    color: '#d4af37',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  contactText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  copyright: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 8,
  },
});
