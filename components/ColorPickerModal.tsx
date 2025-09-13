/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './icons';
import { WardrobeItem } from '../types';
import { cn } from '../lib/utils';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: string) => void;
  garment: WardrobeItem | null;
}

const PREDEFINED_COLORS = [
    { name: 'Red', value: '#dc2626' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Yellow', value: '#ca8a04' },
    { name: 'Purple', value: '#9333ea' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Black', value: '#171717' },
    { name: 'White', value: '#f5f5f5' },
    { name: 'Gray', value: '#737373' },
    { name: 'Pink', value: '#db2777' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Brown', value: '#78350f' },
];

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ isOpen, onClose, onColorSelect, garment }) => {
    const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[0].value);
    
    // Reset selected color when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedColor(PREDEFINED_COLORS[0].value);
        }
    }, [isOpen]);

    if (!garment) return null;

    const handleConfirmRecolor = () => {
        onColorSelect(selectedColor);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    aria-modal="true"
                    role="dialog"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-xl font-serif tracking-wider text-gray-800">Recolor Item</h2>
                            <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800" aria-label="Close color picker">
                                <XIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
                                <img src={garment.url} alt={garment.name} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-500">You are changing the color of:</p>
                                    <p className="text-lg font-semibold text-gray-900">{garment.name}</p>
                                </div>
                            </div>
                            
                            <h3 className="text-md font-semibold text-gray-700 mb-3">Select a color:</h3>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-6">
                                {PREDEFINED_COLORS.map(color => (
                                    <div key={color.name} className="flex flex-col items-center">
                                        <button
                                            onClick={() => setSelectedColor(color.value)}
                                            className={cn(
                                                "w-12 h-12 rounded-full border-2 transition-all active:scale-90 focus:outline-none",
                                                selectedColor.toLowerCase() === color.value.toLowerCase() 
                                                    ? 'ring-2 ring-offset-2 ring-gray-800 border-white' 
                                                    : 'border-gray-200'
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            aria-label={`Select color ${color.name}`}
                                        />
                                        <span className="text-xs text-gray-600 mt-1">{color.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                               <h3 className="text-md font-semibold text-gray-700 mb-3">Or pick a custom color:</h3>
                               <div className="flex items-center gap-4">
                                   <div className="relative w-14 h-14">
                                       <input
                                           type="color"
                                           value={selectedColor}
                                           onChange={(e) => setSelectedColor(e.target.value)}
                                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                           aria-label="Custom color picker"
                                       />
                                       <div 
                                           className="w-full h-full rounded-full border-2 border-gray-200"
                                           style={{ backgroundColor: selectedColor }}
                                       ></div>
                                   </div>
                                   <div className="flex-grow">
                                        <p className="text-sm text-gray-500">Selected Color</p>
                                        <p className="font-mono font-semibold text-lg text-gray-800 tracking-wider">{selectedColor.toUpperCase()}</p>
                                   </div>
                               </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 p-4 mt-auto bg-gray-50 border-t border-gray-200">
                           <button 
                                onClick={onClose}
                                className="px-5 py-2 text-base font-semibold text-gray-700 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                             <button 
                                onClick={handleConfirmRecolor}
                                className="px-5 py-2 text-base font-semibold text-white bg-gray-900 rounded-md cursor-pointer hover:bg-gray-700 transition-colors"
                            >
                                Recolor Item
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ColorPickerModal;
