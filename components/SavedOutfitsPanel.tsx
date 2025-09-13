/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { SavedOutfit } from '../types';
import { Trash2Icon, BookOpenIcon } from './icons';

interface SavedOutfitsPanelProps {
  savedOutfits: SavedOutfit[];
  onLoadOutfit: (outfit: SavedOutfit) => void;
  onDeleteOutfit: (outfitId: string) => void;
  onCreateLookbook: () => void;
  isLoading: boolean;
}

const SavedOutfitsPanel: React.FC<SavedOutfitsPanelProps> = ({ savedOutfits, onLoadOutfit, onDeleteOutfit, onCreateLookbook, isLoading }) => {
  return (
    <div className="pt-6 border-t border-gray-400/50">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-serif tracking-wider text-gray-800">Saved Outfits</h2>
        {savedOutfits.length > 0 && (
          <button 
            onClick={onCreateLookbook}
            disabled={isLoading}
            className="flex items-center text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
            aria-label="Create lookbook from saved outfits"
          >
            <BookOpenIcon className="w-4 h-4 mr-2" />
            Create Lookbook
          </button>
        )}
      </div>

      {savedOutfits.length > 0 ? (
        <div className="space-y-3">
          {savedOutfits.map((outfit) => (
            <div
              key={outfit.id}
              className="group flex items-center justify-between bg-white/50 p-2 rounded-lg border border-gray-200/80"
            >
              <button
                onClick={() => onLoadOutfit(outfit)}
                disabled={isLoading}
                className="flex items-center overflow-hidden w-full text-left disabled:cursor-not-allowed"
                aria-label={`Load outfit ${outfit.name}`}
              >
                <img src={outfit.previewImageUrl} alt={outfit.name} className="flex-shrink-0 w-12 h-12 object-cover rounded-md mr-3" />
                <span className="font-semibold text-gray-800 truncate" title={outfit.name}>
                  {outfit.name}
                </span>
              </button>
              <button
                onClick={() => onDeleteOutfit(outfit.id)}
                className="flex-shrink-0 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50"
                aria-label={`Delete outfit ${outfit.name}`}
              >
                <Trash2Icon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 pt-2">Your saved outfits will appear here.</p>
      )}
    </div>
  );
};

export default SavedOutfitsPanel;
