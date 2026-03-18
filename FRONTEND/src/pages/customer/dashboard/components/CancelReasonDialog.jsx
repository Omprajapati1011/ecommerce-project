import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
import api from '../../../../../api/api';

const CancelReasonDialog = ({ visible, onHide, orderId, onSuccess, showToast }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            showToast?.('warn', 'Validation', 'Please provide a reason for cancellation.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post(`/order/${orderId}/cancel-request`, { reason });
            showToast?.('success', 'Success', 'Cancellation request submitted successfully.');
            onSuccess?.(response.data);
            onHide();
            setReason('');
        } catch (error) {
            showToast?.('error', 'Error', error?.response?.data?.message || 'Failed to submit cancellation request.');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-end items-center gap-3 p-4 border-t border-slate-100 dark:border-slate-800">
            <Button 
                label="Go Back" 
                icon={<X size={18} className="mr-2" />}
                onClick={onHide} 
                className="p-button-text !text-slate-500 hover:!bg-slate-50 dark:hover:!bg-slate-800/50 !rounded-xl !px-4 !py-2.5 !transition-all" 
                disabled={loading}
            />
            <Button 
                label="Submit Request" 
                icon={loading ? null : <CheckCircle2 size={18} className="mr-2" />}
                onClick={handleSubmit} 
                loading={loading}
                className="!bg-rose-600 !border-rose-600 hover:!bg-rose-700 !rounded-xl !px-6 !py-2.5 !shadow-lg !shadow-rose-600/20 !transition-all !font-semibold"
            />
        </div>
    );

    const headerElement = (
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertCircle size={22} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Request Cancellation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Order ID: #{orderId}</p>
            </div>
        </div>
    );

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            footer={footer}
            showHeader={false}
            style={{ width: 'min(520px, 95vw)' }}
            className="cancel-reason-dialog overflow-hidden !rounded-3xl !border-none !shadow-2xl dark:!bg-slate-900"
            modal
            pt={{
                content: { className: '!p-0' },
                root: { className: '!rounded-3xl' }
            }}
        >
            {headerElement}
            
            <div className="p-6 space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-4 flex gap-3">
                    <div className="shrink-0 text-amber-600 dark:text-amber-500">
                        <AlertCircle size={20} />
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                        Please tell us why you want to cancel this order. Your feedback helps us improve our service and prevent future issues.
                    </p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="reason" className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                        Reason for Cancellation <span className="text-rose-500">*</span>
                    </label>
                    <InputTextarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={5}
                        autoResize
                        className="w-full !rounded-2xl !border-slate-200 dark:!border-slate-700 dark:!bg-slate-800/50 !p-4 !text-slate-800 dark:!text-slate-200 !transition-all focus:!border-rose-500 focus:!ring-4 focus:!ring-rose-500/10 hover:!border-slate-300 dark:hover:!border-slate-600 !shadow-sm"
                        placeholder="Please describe the reason specifically..."
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default CancelReasonDialog;

