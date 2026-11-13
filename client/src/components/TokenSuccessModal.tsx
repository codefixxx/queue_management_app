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
        <div className="bg-secondary/70 border border-border rounded-[var(--radius)] p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-border mb-3">
            <div className="truncate mr-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block truncate">
                {queue?.name || 'Service Counter'}
              </span>
              <span className="text-xs font-semibold text-foreground">Official Queue Token</span>
            </div>
            <Badge variant={token.priority === 'VIP' ? 'vip' : 'default'} className="shrink-0">
              {token.priority === 'VIP' ? 'VIP' : 'Standard'}
            </Badge>
          </div>

          <div className="text-center py-2">
            <span className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-foreground block">
              {token.tokenNumber}
            </span>
            <span className="text-xs text-muted-foreground mt-1 block truncate">
              Customer: <strong className="text-foreground">{token.customerName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-xs mt-3">
            <div className="bg-card p-2 rounded-[var(--radius)] border border-border text-center shadow-xs">
              <span className="text-[10px] text-muted-foreground block font-mono">POSITION</span>
              <span className="font-bold text-foreground font-mono text-xs sm:text-sm">#{token.position} in line</span>
            </div>
            <div className="bg-card p-2 rounded-[var(--radius)] border border-border text-center shadow-xs">
              <span className="text-[10px] text-muted-foreground block font-mono">STATUS</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 text-xs">Waiting</span>
            </div>
          </div>

          {token.notes && (
            <p className="text-[11px] text-muted-foreground mt-3 bg-card p-2 rounded-[var(--radius)] border border-border break-words">
              Note: {token.notes}
            </p>
          )}
        </div>

        {/* Action Controls - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-border">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 text-xs flex-1 sm:flex-none justify-center">
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-primary" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-xs flex-1 sm:flex-none justify-center">
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs flex-1 sm:flex-none justify-center">
              Done
            </Button>
            <Button variant="primary" size="sm" onClick={onIssueAnother} className="h-8 text-xs shadow-sm flex-1 sm:flex-none justify-center">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Issue Another
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
