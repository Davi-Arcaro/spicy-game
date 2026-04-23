import { Pressable, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from '@/theme';
import type { IntensityLevel } from '@shared';

const STEPS: Array<{ value: IntensityLevel; label: string }> = [
  { value: 'soft', label: 'Leve' },
  { value: 'medium', label: 'Médio' },
  { value: 'spicy', label: 'Picante' },
];

export interface IntensitySliderProps {
  value: IntensityLevel;
  onChange: (next: IntensityLevel) => void;
}

export function IntensitySlider({ value, onChange }: IntensitySliderProps) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
      {STEPS.map((step) => {
        const selected = step.value === value;
        return (
          <Pressable
            key={step.value}
            onPress={() => onChange(step.value)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing[3],
              borderRadius: theme.radii.md,
              backgroundColor: selected
                ? theme.colors.intent.primary
                : theme.colors.surface.default,
              borderWidth: 1,
              borderColor: selected
                ? theme.colors.intent.primary
                : theme.colors.border.default,
              alignItems: 'center',
            }}
          >
            <Text
              variant="button.md"
              style={{
                color: selected
                  ? theme.colors.text.onPrimary
                  : theme.colors.text.primary,
              }}
            >
              {step.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
