/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import type { WardrobeItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon } from './icons';
import { cn } from '../lib/utils';

interface WardrobePanelProps {
  onItemSelect: (itemFile: File, itemInfo: WardrobeItem) => void;
  activeItemIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
  accessories: WardrobeItem[];
}

type WardrobeTab = 'garments' | 'accessories';

// Helper to convert image URL to a File object using a canvas to bypass potential CORS issues.
const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onItemSelect, activeItemIds, isLoading, wardrobe, accessories }) => {
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<WardrobeTab>('garments');
    
    const itemsToShow = activeTab === 'garments' ? wardrobe : accessories;

    const handleItemClick = async (item: WardrobeItem) => {
        if (isLoading || activeItemIds.includes(item.id)) return;
        setError(null);
        try {
            const file = await urlToFile(item.url, item.name);
            onItemSelect(file, item);
        } catch (err) {
            const detailedError = `Failed to load wardrobe item. This is often a CORS issue. Check the developer console for details.`;
            setError(detailedError);
            console.error(`[CORS Check] Failed to load and convert wardrobe item from URL: ${item.url}. The browser's console should have a specific CORS error message if that's the issue.`, err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            const customItemInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
                type: activeTab === 'garments' ? 'garment' : 'accessory',
            };
            onItemSelect(file, customItemInfo);
        }
    };

  return (
    <div className="pt-6 border-t border-gray-400/50">
        <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">Wardrobe</h2>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
            <button
                onClick={() => setActiveTab('garments')}
                className={cn(
                    "px-4 py-2 text-sm font-semibold transition-colors",
                    activeTab === 'garments' ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-500 hover:text-gray-700"
                )}
            >
                Garments
            </button>
            <button
                onClick={() => setActiveTab('accessories')}
                className={cn(
                    "px-4 py-2 text-sm font-semibold transition-colors",
                    activeTab === 'accessories' ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-500 hover:text-gray-700"
                )}
            >
                Accessories
            </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
            {itemsToShow.map((item) => {
            const isActive = activeItemIds.includes(item.id);
            return (
                <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={isLoading || isActive}
                className="relative aspect-square border rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 group disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={`Select ${item.name}`}
                >
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                </div>
                {isActive && (
                    <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                    </div>
                )}
                </button>
            );
            })}
            <label htmlFor="custom-item-upload" className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-100' : 'hover:border-gray-400 hover:text-gray-600 cursor-pointer'}`}>
                <UploadCloudIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs text-center">Upload</span>
                <input id="custom-item-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} disabled={isLoading}/>
            </label>
        </div>
        {itemsToShow.length === 0 && (
             <p className="text-center text-sm text-gray-500 mt-4">Your uploaded {activeTab} will appear here.</p>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default WardrobePanel;