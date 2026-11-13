import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Token } from '../types';
import { AlertTriangle } from 'lucide-react';

interface CancelTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  onConfirm: (tokenId: string, reason: string) => Promise<void>;
}

export const CancelTokenModal: React.FC<CancelTokenModalProps> = ({
  isOpen,
  onClose,
  token,
  onConfirm
}) => {
  const [reason, setReason] = useState('Customer left premises');
  const [loading, setLoading] = useState(false);

  if (!token) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(token.id, reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const presetReasons = [
    'Customer left premises',
    'Customer no-show / unresponsive',
    'Duplicate request',
    'Customer resolved issue independently',
    'Invalid details'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Token"
      description="This will remove the person from the active queue and adjust line order."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[var(--radius)] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-foreground">
            <span className="font-semibold block text-destructive">
              Are you sure you want to cancel token {token.tokenNumber}?
            </span>
            <span className="text-muted-foreground mt-0.5 block">
              Customer: {token.customerName} ({token.priority} Priority, #{token.position} in line)
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Select Reason</label>
          <div className="space-y-1.5">
            {presetReasons.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2 p-2 rounded-[var(--radius)] border text-xs cursor-pointer transition-colors ${
                  reason === r ? 'border-destructive/40 bg-destructive/10 text-foreground font-medium' : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="text-destructive focus:ring-destructive"
                />
                <span className="truncate">{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Custom Notes (Optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Type custom cancellation reason..."
            className="w-full px-3 py-2 text-base sm:text-xs border border-input rounded-[var(--radius)] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
            Back to Queue
          </Button>
          <Button type="submit" variant="destructive" size="md" loading={loading} className="w-full sm:w-auto shadow-sm">
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
