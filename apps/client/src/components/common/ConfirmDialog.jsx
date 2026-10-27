import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this operation?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'teal'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start space-x-3.5">
        <div
          className={`p-2.5 rounded-xl flex-shrink-0 shadow-2xs ${
            isDanger ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}
        >
          {isDanger ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-sm font-bold text-navy-950">{title}</h4>
          <p className="mt-1 text-xs text-navy-600 leading-relaxed font-normal">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
