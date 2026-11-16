import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { CREAM } from '@/theme/tokens';

export default function GiftIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12v10H4V12"
        stroke={CREAM.surface}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 7H2v5h20V7z"
        stroke={CREAM.surface}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22V7"
        stroke={CREAM.surface}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7z"
        stroke={CREAM.surface}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"
        stroke={CREAM.surface}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
