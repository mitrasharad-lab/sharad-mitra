/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { OutfitLayer } from '../types';
import { Trash2Icon, PaletteIcon } from './icons';

interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  onRemoveLastGarment: () => void;
  onRecolorGarment: (layerIndex: number) => void;
}

const OutfitStack: React.FC<OutfitStackProps> = ({ outfitHistory, onRemoveLastGarment, onRecolorGarment }) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 border-b border-gray-400/50 pb-2 mb-3">Outfit Stack</h2>
      <div className="space-y-2">
        {outfitHistory.map((layer, index) => (
          <div
            key={layer.item?.id || 'base'}
            className="flex items-center justify-between bg-white/50 p-2 rounded-lg animate-fade-in border border-gray-200/80"
          >
            <div className="flex items-center overflow-hidden">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 mr-3 text-xs font-bold text-gray-600 bg-gray-200 rounded-full">
                  {index + 1}
                </span>
                {layer.item && (
                    <img src={layer.item.url} alt={layer.item.name} className="flex-shrink-0 w-12 h-12 object-cover rounded-md mr-3" />
                )}
                <span className="font-semibold text-gray-800 truncate" title={layer.item?.name}>
                  {layer.item ? layer.item.name : 'Base Model'}
                </span>
            </div>
            {index > 0 && index === outfitHistory.length - 1 && (
              <div className="flex items-center flex-shrink-0">
                <button
                  onClick={() => onRecolorGarment(index)}
                  className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-blue-50"
                  aria-label={`Recolor ${layer.item?.name}`}
                >
                  <PaletteIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={onRemoveLastGarment}
                  className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50"
                  aria-label={`Remove ${layer.item?.name}`}
                >
                  <Trash2Icon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ))}
        {outfitHistory.length === 1 && (
            <p className="text-center text-sm text-gray-500 pt-4">Your stacked items will appear here. Select an item from the wardrobe below.</p>
        )}
      </div>
    </div>
  );
};

export default OutfitStack;