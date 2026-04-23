import { ConfirmationModal } from '@/components';

export interface AdultGateModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdultGateModal({ visible, onConfirm, onCancel }: AdultGateModalProps) {
  return (
    <ConfirmationModal
      visible={visible}
      title="Confirmar maioridade"
      description="Este conteúdo é restrito a maiores de 18 anos. Confirma?"
      confirmLabel="Sou maior"
      cancelLabel="Cancelar"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
