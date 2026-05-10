import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import {
  GOLD,
  CREAM,
  FONT_WEIGHT,
  FONT_SIZE,
  SPACING,
} from '@/theme/tokens';

type Action = 'service' | 'projects' | 'tools' | 'events' | 'accounts';

interface QuickActionsNavProps {
  onPress: (action: Action) => void;
  style?: ViewStyle;
}

function ServiceIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18v-6a9 9 0 0118 0v6"
        stroke={GOLD.mid}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"
        stroke={GOLD.mid}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProjectsIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"
        stroke={GOLD.mid}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ToolsIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke={GOLD.mid}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EventsIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18"
        stroke={GOLD.mid}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AccountsIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 14l6-6M9.5 9a.5.5 0 110-1 .5.5 0 010 1zM14.5 14a.5.5 0 110-1 .5.5 0 010 1z"
        stroke={GOLD.mid}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16l-3.5-2L12 21l-3.5-2L5 21z"
        stroke={GOLD.mid}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const ACTIONS: { key: Action; label: string; Icon: React.FC }[] = [
  { key: 'service', label: 'שירות אישי', Icon: ServiceIcon },
  { key: 'projects', label: 'פרויקטים', Icon: ProjectsIcon },
  { key: 'tools', label: 'כלי עבודה', Icon: ToolsIcon },
  { key: 'events', label: 'אירועים', Icon: EventsIcon },
  { key: 'accounts', label: 'חשבוניות', Icon: AccountsIcon },
];

export default function QuickActionsNav({ onPress, style }: QuickActionsNavProps) {
  return (
    <View style={[styles.row, style]}>
      {ACTIONS.map(({ key, label, Icon }) => (
        <Pressable key={key} style={styles.item} onPress={() => onPress(key)}>
          <View style={styles.circle}>
            <LinearGradient
              colors={[CREAM.surface, CREAM.muted]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Icon />
          </View>
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  item: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 0.5,
    borderColor: GOLD.mid,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: GOLD.text,
    fontSize: FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.regular,
    textAlign: 'center',
  },
});
