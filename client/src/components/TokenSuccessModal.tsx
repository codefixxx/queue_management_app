import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Token, QueueSummary } from '../types';
import { Check, Copy, Printer, Plus } from 'lucide-react';

interface TokenSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  queue: QueueSummary | null;
  onIssueAnother: () => void;
}

export const TokenSuccessModal: React.FC<TokenSuccessModalProps> = ({
  isOpen,
  onClose,
  token,
  queue,
  onIssueAnother
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!token) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Queue Ticket: ${token.tokenNumber}\nCustomer: ${token.customerName}\nLine: ${queue?.name || 'Service Queue'}\nPosition: #${token.position}`
    ).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ticket Issued Successfully"
      description="Token generated and logged into the active queue line."
    >
      <div className="space-y-4">
        {/* Physical Ticket Card Receipt */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                {queue?.name || 'Service Counter'}
              </span>
              <span className="text-xs font-semibold text-slate-700">Official Queue Token</span>
            </div>
            <Badge variant={token.priority === 'VIP' ? 'vip' : 'default'}>
              {token.priority === 'VIP' ? 'VIP' : 'Standard'}
            </Badge>
          </div>

          <div className="text-center py-2">
            <span className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-slate-950 block">
              {token.tokenNumber}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Customer: <strong className="text-slate-800">{token.customerName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200/80 text-xs mt-3">
            <div className="bg-white p-2 rounded-lg border border-slate-200/60 text-center">
              <span className="text-[10px] text-slate-400 block font-mono">POSITION</span>
              <span className="font-bold text-slate-800 font-mono text-sm">#{token.position} in line</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200/60 text-center">
              <span className="text-[10px] text-slate-400 block font-mono">STATUS</span>
              <span className="font-semibold text-amber-700 text-xs">Waiting</span>
            </div>
          </div>

          {token.notes && (
            <p className="text-[11px] text-slate-500 mt-3 bg-white p-2 rounded border border-slate-200/60">
              Note: {token.notes}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 text-xs text-slate-700">
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-xs text-slate-700 hidden sm:inline-flex">
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="sm" onClick={onIssueAnother} className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Issue Another
            </Button>
            <Button variant="primary" size="sm" onClick={onClose} className="h-8 text-xs">
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
