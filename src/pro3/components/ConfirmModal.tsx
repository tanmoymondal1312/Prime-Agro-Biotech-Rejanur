import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "হ্যাঁ, মুছে ফেলুন", 
  cancelText = "বাতিল" 
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            
            <button 
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              
              <h3 className="text-2xl font-black text-stone-900 mb-3">{title}</h3>
              <p className="text-stone-500 leading-relaxed mb-8">{message}</p>
              
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={onConfirm}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-100 active:scale-95"
                >
                  {confirmText}
                </button>
                <button
                  onClick={onCancel}
                  className="w-full py-4 text-stone-500 font-bold hover:bg-stone-50 rounded-2xl transition-all"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
