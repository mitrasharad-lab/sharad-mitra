/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng, toBlob } from 'html-to-image';
import { SavedOutfit } from '../types';
import { XIcon, DownloadIcon, Share2Icon } from './icons';

interface LookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedOutfits: SavedOutfit[];
}

const LookbookModal: React.FC<LookbookModalProps> = ({ isOpen, onClose, savedOutfits }) => {
    const lookbookRef = React.useRef<HTMLDivElement>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleDownload = async () => {
        if (!lookbookRef.current) return;
        setIsProcessing(true);
        try {
            const dataUrl = await toPng(lookbookRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = 'my-lookbook.png';
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('oops, something went wrong!', err);
            alert('Failed to create lookbook image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleShare = async () => {
        if (!lookbookRef.current) return;
        
        // Web Share API support check
        if (!navigator.share || !navigator.canShare) {
            alert("Your browser doesn't support sharing. The image will be downloaded instead.");
            handleDownload();
            return;
        }

        setIsProcessing(true);
        try {
            const blob = await toBlob(lookbookRef.current, { cacheBust: true, pixelRatio: 2 });
            if (!blob) throw new Error('Could not create image blob');

            const file = new File([blob], "my-lookbook.png", { type: blob.type });

            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Lookbook',
                    text: 'Check out my latest styles!',
                    files: [file],
                });
            } else {
                throw new Error("Cannot share this file type.");
            }
        } catch (err) {
            console.error('Share failed:', err);
            alert('Sharing failed. The image will be downloaded instead.');
            handleDownload();
        } finally {
            setIsProcessing(false);
        }
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
                        className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-2xl font-serif tracking-wider text-gray-800">My Lookbook</h2>
                            <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800" aria-label="Close lookbook">
                                <XIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto">
                            <div ref={lookbookRef} className="bg-stone-50 p-8">
                                <h1 className="text-4xl font-serif text-center text-stone-800 mb-8">My Lookbook</h1>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                    {savedOutfits.map(outfit => (
                                        <div key={outfit.id} className="flex flex-col items-center gap-2">
                                            <img 
                                                src={outfit.previewImageUrl} 
                                                alt={outfit.name} 
                                                className="w-full aspect-[2/3] object-cover rounded-lg shadow-md"
                                            />
                                            <p className="font-semibold text-stone-700 text-center">{outfit.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 p-4 border-t border-gray-200 mt-auto">
                           <button 
                                onClick={handleDownload}
                                disabled={isProcessing}
                                className="flex items-center justify-center px-4 py-2 text-base font-semibold text-gray-700 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                <DownloadIcon className="w-5 h-5 mr-2" />
                                {isProcessing ? 'Processing...' : 'Download as Image'}
                            </button>
                             <button 
                                onClick={handleShare}
                                disabled={isProcessing}
                                className="flex items-center justify-center px-4 py-2 text-base font-semibold text-white bg-gray-900 rounded-md cursor-pointer hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                <Share2Icon className="w-5 h-5 mr-2" />
                                {isProcessing ? 'Processing...' : 'Share'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LookbookModal;
