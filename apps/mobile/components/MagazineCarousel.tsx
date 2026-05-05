import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GOLD, CREAM, SHADOW, FONT_SIZE, SPACING, RADIUS, GOLD_METALLIC_STOPS, GOLD_METALLIC_LOCATIONS } from '@/theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 5;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.md * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

const articles = [
  { title: 'בית החווה Farasha | אירוח איטי בין הרי האטלס למרקש', excerpt: 'בית החווה פאראשה ממוקם במרוקו, כ-40 דקות נסיעה משדה התעופה של מרקש', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/04/שער.png', url: 'https://stannelmarketplace.com/%d7%91%d7%99%d7%aa-%d7%94%d7%97%d7%95%d7%95%d7%94-farasha/' },
  { title: 'המתח העדין שבין קרבה לניכור | לירן ורדיאל', excerpt: 'השפה של לירן ורדיאל אינה מתמסרת להגדרה אחת ברורה', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/04/COVER.jpg', url: 'https://stannelmarketplace.com/%d7%94%d7%9e%d7%aa%d7%97-%d7%94%d7%a2%d7%93%d7%99%d7%9f/' },
  { title: 'שפה מאופקת מול נוף דרמטי | בית על חוף ספרד', excerpt: 'על מגרש תלול המשקיף אל הים, באזור טויש-מסקראט שבקאלפה', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/04/שער-1.jpg', url: 'https://stannelmarketplace.com/%d7%a9%d7%a4%d7%94-%d7%9e%d7%90%d7%95%d7%a4%d7%a7%d7%aa/' },
  { title: 'קווים נקיים, בטון חשוף וגרם מדרגות פיסולי', excerpt: 'הבית שתכנן אדריכל ירון אלדד יחד עם הנדסאית האדריכלות נוי סנדגרטן', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/02/אינסטגרם.jpg', url: 'https://stannelmarketplace.com/%d7%a7%d7%95%d7%95%d7%99%d7%9d-%d7%a0%d7%a7%d7%99%d7%99%d7%9d/' },
  { title: 'מחוברים לאדמה | יקב בוטיק ואורווה מקצועית', excerpt: 'פרויקט שמחבר בין שני חלומות ושני מגרשים צמודים ביקנעם המושבה', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/02/שער-אינסטגרם-כתבה.jpg', url: 'https://stannelmarketplace.com/%d7%9e%d7%97%d7%95%d7%91%d7%a8%d7%99%d7%9d-%d7%9c%d7%90%d7%93%d7%9e%d7%94/' },
  { title: 'איך מתכננים בית שבו מסות כבדות נדמות כמרחפות', excerpt: 'בית בהרצליה פיתוח, שנבנה עבור משפחה בת שש נפשות על מגרש ששטחו דונם', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/12/Image.jpg', url: 'https://stannelmarketplace.com/%d7%90%d7%99%d7%9a-%d7%9e%d7%aa%d7%9b%d7%a0%d7%a0%d7%99%d7%9d/' },
  { title: 'ספוטלייט | האדריכלות ההוליסטית של נוימן חיינר', excerpt: 'משרד האדריכלים נוימן-חיינר הוא בין המגוונים והמשפיעים בתחום', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/01/שער-קטן.jpg', url: 'https://stannelmarketplace.com/%d7%a1%d7%a4%d7%95%d7%98%d7%9c%d7%99%d7%99%d7%98/' },
  { title: 'הפרויקט הסודי בעיר הלבנה | פנטהאוז בבניין לשימור', excerpt: 'שיפוץ מיוחד ומסקרן לדירת פנטהאוז בבניין תל-אביבי לשימור', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/01/שער-כתבה-.jpg', url: 'https://stannelmarketplace.com/2277/' },
  { title: 'הבית שתל אביב לא ראתה קודם | אסיה פוגשת מזרח־תיכון', excerpt: 'בני זוג ושלושת בניהם המתבגרים רכשו בית ברחוב שקט בצפון תל אביב', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/12/cover-big.jpg', url: 'https://stannelmarketplace.com/%d7%90%d7%a1%d7%99%d7%94-%d7%a4%d7%95%d7%92%d7%a9%d7%aa/' },
  { title: 'יש לי ספריה בראש על כל לקוח | קרן ליזרוביץ', excerpt: 'בסבלנות, בהקשבה ובמסירות, תופרת אדריכלית קרן ליזרוביץ פרויקט ייחודי', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/03/5-1.jpg', url: 'https://stannelmarketplace.com/%d7%99%d7%a9-%d7%9c%d7%99-%d7%a1%d7%a4%d7%a8%d7%99%d7%94/' },
  { title: 'בין אייקונים מקומיים לאופק בינלאומי חדש | קימל אשכולות', excerpt: 'משרד האדריכלים קימל אשכולות מציין השנה 40 שנות פעילות', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/12/22.jpg', url: 'https://stannelmarketplace.com/%d7%91%d7%99%d7%9f-%d7%90%d7%99%d7%99%d7%a7%d7%95%d7%a0%d7%99%d7%9d/' },
  { title: 'הפנינה השחורה – בית עכשווי המאזן בין חומריות, אור וצל', excerpt: 'מכל זווית ובכל מבט, הבית הזה מרשים ומוקפד', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/11/שער.jpg', url: 'https://stannelmarketplace.com/%d7%94%d7%a4%d7%a0%d7%99%d7%a0%d7%94-%d7%94%d7%a9%d7%97%d7%95%d7%a8%d7%94/' },
  { title: 'בית חלומי בנחלה – משפחה ישראלית פוגשת סטייל איטלקי', excerpt: 'שיפוץ בית במושב במרכז הארץ עבור בני זוג בגיל השלישי', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/09/שער-אורלי.jpg', url: 'https://stannelmarketplace.com/%d7%91%d7%99%d7%aa-%d7%97%d7%9c%d7%95%d7%9e%d7%99/' },
  { title: 'להוריד הילוך מעל העיר | פנטהאוז בדרום תל אביב', excerpt: 'בדרום תל־אביב, בלב אזור תעשייתי של נגריות, בתי מלאכה וחנויות', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/02/Yael.jpg', url: 'https://stannelmarketplace.com/%d7%9c%d7%94%d7%95%d7%a8%d7%99%d7%93-%d7%94%d7%99%d7%9c%d7%95%d7%9a/' },
  { title: 'יוצרת העולמות של קפה גן סיפור | שני רינג', excerpt: 'המסעדות של גן סיפור אינן פועלות בתוך המרחב העירוני הרגיל', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/02/שער-שני.jpg', url: 'https://stannelmarketplace.com/2574/' },
  { title: 'לחיות את העיר בקצב אחר | דירת לופט בלב תל אביב', excerpt: 'מגדל תל־אביבי גבוה או שכונה ותיקה ובעלת אופי?', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/01/שער-קטן-1.jpg', url: 'https://stannelmarketplace.com/%d7%9c%d7%97%d7%99%d7%95%d7%aa-%d7%90%d7%aa-%d7%94%d7%a2%d7%99%d7%a8/' },
  { title: 'בין קצב גלובלי לשקט מקומי | בית על חופי אשקלון', excerpt: 'על רצועת החוף של אשקלון שוכן פרויקט מגורים יוקרתי בשטח של 560 מ״ר', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/01/שער-כתבה-1.jpg', url: 'https://stannelmarketplace.com/%d7%91%d7%99%d7%9f-%d7%a7%d7%a6%d7%91/' },
  { title: 'מינימליזם יוקרתי בהרמונייה עם הטבע', excerpt: 'ליעד יוסף, מעצב פנים שכבר ביסס את מעמדו גם ככוכב רשת ומשפיען', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/09/15.png', url: 'https://stannelmarketplace.com/%d7%9e%d7%99%d7%a0%d7%99%d7%9e%d7%9c%d7%99%d7%96%d7%9d/' },
  { title: 'איך נראה "חלומודרני" בבית במזכרת בתיה', excerpt: 'אדריכל רז קשלס, העוסק בבנייה פרטית לצד תכנון מסחרי ומשרדים', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/09/13.png', url: 'https://stannelmarketplace.com/%d7%90%d7%99%d7%9a-%d7%a0%d7%a8%d7%90%d7%94/' },
  { title: 'אדריכלות טוטאלית בסביון – חלל, חומר וטבע', excerpt: 'לתפיסתו של אדריכל סטפן מטי, המבנה הוא שיח בין האדם לסביבתו', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/09/14.png', url: 'https://stannelmarketplace.com/stefan-matty-architect/' },
];

interface MagazineCarouselProps {
  style?: any;
}

export default function MagazineCarousel({ style }: MagazineCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const visible = [
    articles[currentIndex % articles.length],
    articles[(currentIndex + 1) % articles.length],
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Linking.openURL('https://stannelmarketplace.com/')}>
          <Text style={styles.allArticles}>{'כל הכתבות >'}</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <View>
            <Text style={styles.headerTitle}>stannel magazine</Text>
            <Text style={styles.headerSubtitle}>השראה, טרנדים ועיצוב</Text>
          </View>
          <LinearGradient
            colors={GOLD_METALLIC_STOPS as unknown as string[]}
            locations={GOLD_METALLIC_LOCATIONS as unknown as number[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBadge}
          >
            <Text style={styles.headerBadgeText}>S</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Cards */}
      <View style={styles.cardsRow}>
        {visible.map((article, i) => (
          <TouchableOpacity
            key={`${currentIndex}-${i}`}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => Linking.openURL(article.url)}
          >
            <Image source={{ uri: article.image }} style={styles.cardImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
              locations={[0, 0.4, 1]}
              style={styles.cardGradient}
            />
            {i === 0 && (
              <LinearGradient
                colors={GOLD_METALLIC_STOPS as unknown as string[]}
                locations={GOLD_METALLIC_LOCATIONS as unknown as number[]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.magazineBadge}
              >
                <Text style={styles.magazineBadgeText}>stannel magazine</Text>
              </LinearGradient>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>{article.title}</Text>
              <Text style={styles.cardExcerpt} numberOfLines={2}>{article.excerpt}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {articles.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setCurrentIndex(i)}>
            <LinearGradient
              colors={i === currentIndex ? (GOLD_METALLIC_STOPS as unknown as string[]) : [CREAM.muted, CREAM.muted]}
              locations={i === currentIndex ? (GOLD_METALLIC_LOCATIONS as unknown as number[]) : [0, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: GOLD.text,
    textAlign: 'right',
    fontFamily: 'serif',
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xxs,
    color: GOLD.mid,
    textAlign: 'right',
  },
  headerBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'serif',
  },
  allArticles: {
    fontSize: FONT_SIZE.xs,
    color: GOLD.mid,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    backgroundColor: CREAM.surface,
    padding: CARD_GAP,
    borderRadius: RADIUS.lg,
    ...SHADOW.card,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  magazineBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  magazineBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#fff',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 16,
    marginBottom: 4,
    textAlign: 'right',
  },
  cardExcerpt: {
    fontSize: FONT_SIZE.xxs,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 14,
    textAlign: 'right',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
    marginTop: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
  },
});
