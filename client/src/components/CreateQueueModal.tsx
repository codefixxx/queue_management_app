import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { api } from '../api';
import { QueueSummary } from '../types';

interface CreateQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQueueCreated: (queue: QueueSummary) => void;
}

export const CreateQueueModal: React.FC<CreateQueueModalProps> = ({
  isOpen,
  onClose,
  onQueueCreated
}) => {
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('Q');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.createQueue({
        name: name.trim(),
        prefix: prefix.trim().toUpperCase() || 'Q',
        description: description.trim() || undefined
      });
      onQueueCreated(res.queue);
      setName('');
      setPrefix('Q');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Queue"
      description="Setup a service counter or line with custom prefix and name."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-[var(--radius)]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Queue Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Technical Consultation or Counter A"
            className="w-full px-3 py-2 text-base sm:text-sm border border-input rounded-[var(--radius)] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Token Prefix</label>
            <input
              type="text"
              maxLength={4}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="e.g. TC or A"
              className="w-full px-3 py-2 text-base sm:text-sm border border-input rounded-[var(--radius)] bg-background text-foreground uppercase font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            />
            <p className="text-[11px] text-muted-foreground font-mono mt-1">Preview: {prefix || 'Q'}-001</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Queue Type</label>
            <div className="px-3 py-2 text-xs text-muted-foreground bg-secondary border border-border rounded-[var(--radius)]">
              Sequential FIFO with reordering
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief purpose or instructions for this line..."
            className="w-full px-3 py-2 text-base sm:text-sm border border-input rounded-[var(--radius)] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring resize-none transition-colors"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" size="md" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="w-full sm:w-auto shadow-sm">
            Create Queue
          </Button>
        </div>
      </form>
    </Modal>
  );
};
