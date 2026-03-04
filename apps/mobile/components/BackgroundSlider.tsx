import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  { uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80' },
  { uri: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80' },
  { uri: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80' },
  { uri: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80' },
  { uri: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1920&q=80' },
];

export default function BackgroundSlider() {
  const [current, setCurrent] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1.1)).current;

  useEffect(() => {
    // Auto-advance slides
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Change slide
        setCurrent((prev) => (prev + 1) % SLIDES.length);

        // Fade in
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Ken Burns effect - subtle scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.0,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Background Image */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Image
          source={SLIDES[current]}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={1000}
          cachePolicy="memory-disk"
        />
      </Animated.View>

      {/* Gradient Overlays */}
      <LinearGradient
        colors={[
          'rgba(6,15,31,0.7)',
          'rgba(6,15,31,0.5)',
          'rgba(6,15,31,0.85)',
        ]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Side gradient */}
      <LinearGradient
        colors={[
          'rgba(6,15,31,0.6)',
          'transparent',
          'rgba(6,15,31,0.4)',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating particles effect */}
      {[...Array(5)].map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: 100 + Math.random() * 150,
              height: 100 + Math.random() * 150,
              left: `${Math.random() * 80}%`,
              top: `${Math.random() * 80}%`,
              opacity: 0.03 + Math.random() * 0.05,
            },
          ]}
        />
      ))}

      {/* Slide indicators */}
      <View style={styles.indicators}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.indicator,
              i === current && styles.indicatorActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'white',
  },
  indicators: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#d4af37',
  },
});
