import { Flame } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path, Circle } from 'react-native-svg';

import { useTheme } from '@/theme';

const SECTORS = 8;
const SECTOR_LABELS = ['V', 'D', 'V', 'D', 'V', 'D', '?', '⭐'];

export interface RouletteProps {
  size?: number;
  spinning: boolean;
  finalAngle?: number;
  durationMs?: number;
  onSpinEnd?: () => void;
}

export function Roulette({
  size = 280,
  spinning,
  finalAngle = 0,
  durationMs = 2800,
  onSpinEnd,
}: RouletteProps) {
  const theme = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (spinning) {
      rotation.value = 0;
      // 5 full rotations + final angle, eased out for dramatic stop
      rotation.value = withTiming(
        360 * 5 + finalAngle,
        { duration: durationMs, easing: Easing.bezier(0.22, 0.61, 0.36, 1) },
        (finished) => {
          if (finished && onSpinEnd) onSpinEnd();
        }
      );
    }
  }, [spinning, finalAngle, durationMs, rotation, onSpinEnd]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const sectors = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4;
    const anglePer = (Math.PI * 2) / SECTORS;
    return SECTOR_LABELS.map((label, i) => {
      const start = i * anglePer - Math.PI / 2;
      const end = start + anglePer;
      const x1 = cx + radius * Math.cos(start);
      const y1 = cy + radius * Math.sin(start);
      const x2 = cx + radius * Math.cos(end);
      const y2 = cy + radius * Math.sin(end);
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
      const fill = i % 2 === 0 ? theme.colors.intent.primary : theme.colors.intent.accent;
      return { path, fill, label };
    });
  }, [size, theme]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size}>
          <G>
            {sectors.map((s, i) => (
              <Path key={i} d={s.path} fill={s.fill} />
            ))}
          </G>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 6}
            fill={theme.colors.background.raised}
            stroke={theme.colors.card.accent}
            strokeWidth={2}
          />
        </Svg>
      </Animated.View>

      {/* Center icon (not rotating) */}
      <View
        style={{
          position: 'absolute',
          width: size / 3,
          height: size / 3,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Flame size={size / 8} color={theme.colors.intent.primary} />
      </View>

      {/* Pointer (top, fixed) */}
      <View
        style={{
          position: 'absolute',
          top: -4,
          width: 0,
          height: 0,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderTopWidth: 18,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: theme.colors.text.primary,
        }}
      />
    </View>
  );
}
