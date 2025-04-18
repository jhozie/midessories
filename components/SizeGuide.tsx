'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

type SizeGuideProps = {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuide({ isOpen, onClose }: SizeGuideProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Size Guide</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-6 text-left">Device Model</th>
                  <th className="py-4 px-6 text-left">Dimensions</th>
                  <th className="py-4 px-6 text-left">Case Size</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6">iPhone 13</td>
                  <td className="py-4 px-6">146.7 x 71.5 x 7.65 mm</td>
                  <td className="py-4 px-6">Fits perfectly</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6">iPhone 13 Pro</td>
                  <td className="py-4 px-6">146.7 x 71.5 x 7.65 mm</td>
                  <td className="py-4 px-6">Fits perfectly</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6">iPhone 14</td>
                  <td className="py-4 px-6">146.7 x 71.5 x 7.80 mm</td>
                  <td className="py-4 px-6">Fits perfectly</td>
                </tr>
                <tr>
                  <td className="py-4 px-6">iPhone 14 Pro</td>
                  <td className="py-4 px-6">147.5 x 71.5 x 7.85 mm</td>
                  <td className="py-4 px-6">Fits perfectly</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-sm text-gray-600">
            Note: All dimensions are approximate. Our cases are designed to provide a snug fit while maintaining easy access to all ports and buttons.
          </p>
        </div>
      </div>
    </div>
  );
} 