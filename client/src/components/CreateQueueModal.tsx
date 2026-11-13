import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { api } from '../api';
import { QueueSummary } from '../types';
import { Layers } from 'lucide-react';

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
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Queue Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Technical Consultation or Counter A"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Token Prefix</label>
            <input
              type="text"
              maxLength={4}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="e.g. TC or A"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Preview: {prefix || 'Q'}-001</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Queue Type</label>
            <div className="px-3 py-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg">
              Sequential FIFO with reordering
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Purpose, counter location, or special instructions..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading}>
            <Layers className="w-4 h-4 mr-1.5" />
            Create Queue
          </Button>
        </div>
      </form>
    </Modal>
  );
};

