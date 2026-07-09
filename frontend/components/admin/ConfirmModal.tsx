'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  showCancel?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  showCancel = true,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-lg border border-border/80 max-w-sm w-full p-6 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {isDanger && (
            <div className="p-2.5 bg-red-50 text-red-500 rounded-full flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
          )}
          <div>
            <h3 className="font-display text-base font-medium text-text-primary mb-1">{title}</h3>
            <p className="font-body text-xs text-text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: message }} />
          </div>
        </div>

        <div className="mt-6 flex gap-2.5 justify-end">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 font-body text-xs text-text-muted hover:text-text-primary hover:bg-gray-50 border border-border rounded transition-all"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white font-body text-xs font-semibold rounded transition-all shadow-sm ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-text-primary hover:bg-gray-800 active:bg-black'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
