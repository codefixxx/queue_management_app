import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { api } from '../api';
import { QueueSummary, Token } from '../types';
import { Ticket, Sparkles, UserPlus } from 'lucide-react';

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  queues: QueueSummary[];
  selectedQueueId: string | null;
  onTokenAdded: (token: Token) => void;
}

export const AddTokenModal: React.FC<AddTokenModalProps> = ({
  isOpen,
  onClose,
  queues,
  selectedQueueId,
  onTokenAdded
}) => {
  const [customQueueId, setCustomQueueId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'VIP'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queueId = customQueueId || selectedQueueId || (queues[0]?.id ?? '');
  const activeQueue = queues.find((q) => q.id === queueId) || queues[0];

  const handleClose = () => {
    setError(null);
    setCustomQueueId(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !queueId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.addToken(queueId, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        priority
      });

      onTokenAdded(res.token);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setPriority('NORMAL');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add person to queue');
    } finally {
      setLoading(false);
    }
  };

  const nextSeq = (activeQueue?.currentNumber || 0) + 1;
  const previewTokenNumber = `${activeQueue?.prefix || 'Q'}-${String(nextSeq).padStart(3, '0')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Person to Queue"
      description="Issue a new numbered token ticket for customer service."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-[var(--radius)]">
            {error}
          </div>
        )}

        {/* Live Token Ticket Preview */}
        <div className="p-3.5 sm:p-4 bg-secondary/70 border border-border rounded-[var(--radius)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-[11px] sm:text-xs font-semibold text-foreground uppercase tracking-wide">
                New Token Ticket
              </span>
            </div>
            <Badge variant={priority === 'VIP' ? 'vip' : 'default'}>
              {priority === 'VIP' ? '★ VIP PRIORITY' : 'Standard'}
            </Badge>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground tracking-tight">
                {previewTokenNumber}
              </span>
              <span className="text-xs text-muted-foreground block mt-0.5 truncate max-w-[150px] sm:max-w-none">
                Line: <strong className="text-foreground">{activeQueue?.name || 'Main Queue'}</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] sm:text-xs text-muted-foreground block font-mono">EST. POSITION</span>
              <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                #{(activeQueue?.counts?.waiting || 0) + 1} in line
              </span>
            </div>
          </div>
        </div>

        {/* Queue Selector if multiple exist */}
        {queues.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Target Queue</label>
            <select
              value={queueId}
              onChange={(e) => setCustomQueueId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-input rounded-[var(--radius)] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            >
              {queues.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name} ({q.prefix}) — {q.counts.waiting} waiting
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Customer Name *</label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. John Doe or Jane Smith"
            className="w-full px-3 py-2 text-base sm:text-sm border border-input rounded-[var(--radius)] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
          />
        </div>

        {/* Phone & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Mobile Number (Optional)</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +1 555-0199"
              className="w-full px-3 py-2 text-base sm:text-sm border border-input rounded-[var(--radius)] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Priority Level</label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary border border-border rounded-[var(--radius)]">
              <button
                type="button"
                onClick={() => setPriority('NORMAL')}
                className={`min-h-[38px] sm:min-h-[32px] py-1.5 text-xs font-medium rounded-[var(--radius)] transition-all cursor-pointer flex items-center justify-center ${
                  priority === 'NORMAL'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setPriority('VIP')}
                className={`min-h-[38px] sm:min-h-[32px] py-1.5 text-xs font-medium rounded-[var(--radius)] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  priority === 'VIP'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                VIP
              </button>
            </div>
          </div>
        </div>

        {/* Service Notes */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Service Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Needs document verification"
            className="w-full px-3 py-2 text-base sm:text-sm border border-input rounded-[var(--radius)] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" size="md" onClick={handleClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="w-full sm:w-auto shadow-sm">
            <UserPlus className="w-4 h-4 mr-1.5" />
            Issue Token
          </Button>
        </div>
      </form>
    </Modal>
  );
};
