import type { ReactNode } from 'react';
import {
  Modal as RNModal,
  Pressable,
  View,
  type ModalProps as RNModalProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { Text } from './Text';
import { Button } from './Button';

export interface ModalProps extends Omit<RNModalProps, 'children'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
}

export function Modal({
  visible,
  onClose,
  title,
  description,
  children,
  ...rest
}: ModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      {...rest}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          paddingHorizontal: theme.spacing[5],
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <Pressable onPress={() => {}}>
          <View
            style={[
              {
                backgroundColor: theme.colors.background.overlay,
                borderRadius: theme.radii.lg,
                padding: theme.spacing[6],
                gap: theme.spacing[4],
              },
              theme.shadows.lg,
            ]}
          >
            {title ? (
              <Text variant="heading.lg" color="text.primary">
                {title}
              </Text>
            ) : null}
            {description ? (
              <Text variant="body.lg" color="text.secondary">
                {description}
              </Text>
            ) : null}
            {children}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmationModal({
  visible,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive,
  onConfirm,
  onCancel,
  loading,
}: ConfirmationModalProps) {
  return (
    <Modal visible={visible} onClose={onCancel} title={title} description={description}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button variant="secondary" size="md" onPress={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="primary"
            size="md"
            destructive={destructive}
            onPress={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </View>
      </View>
    </Modal>
  );
}
