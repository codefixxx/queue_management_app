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
  const [queueId, setQueueId] = useState(selectedQueueId || (queues[0]?.id ?? ''));
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'VIP'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep queueId in sync with selectedQueueId prop
  React.useEffect(() => {
    if (selectedQueueId) {
      setQueueId(selectedQueueId);
    } else if (queues.length > 0 && !queueId) {
      setQueueId(queues[0].id);
    }
  }, [selectedQueueId, queues]);

  const activeQueue = queues.find((q) => q.id === queueId) || queues[0];

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
      onClose={onClose}
      title="Add Person to Queue"
      description="Issue a new numbered token ticket for customer service."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Live Token Ticket Preview */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                New Token Ticket
              </span>
            </div>
            <Badge variant={priority === 'VIP' ? 'vip' : 'default'}>
              {priority === 'VIP' ? '★ VIP PRIORITY' : 'Standard'}
            </Badge>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold font-mono tracking-tight text-blue-950">
                {previewTokenNumber}
              </span>
              <p className="text-xs text-blue-700 font-medium mt-0.5">
                Target: {activeQueue?.name || 'Select a queue'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Waiting Position</span>
              <span className="text-sm font-bold text-slate-800">
                #{(activeQueue?.counts.waiting || 0) + 1} in line
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Queue *</label>
          <select
            value={queueId}
            onChange={(e) => setQueueId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {queues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name} ({q.counts.waiting} waiting)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. John Doe or Jane Smith"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1-555-0100"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriority('NORMAL')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                  priority === 'NORMAL'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority('VIP')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                  priority === 'VIP'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                VIP
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reason for Visit</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Account update, passport renewal, payment inquiry..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Issue Token
          </Button>
        </div>
      </form>
    </Modal>
  );
};

