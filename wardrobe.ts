/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from './types';

// Default wardrobe items hosted for easy access via jsDelivr CDN to ensure proper CORS headers.
export const defaultWardrobe: WardrobeItem[] = [
  {
    id: 'gemini-sweat',
    name: 'Gemini Sweat',
    url: 'https://cdn.jsdelivr.net/gh/ammaarreshi/app-images@main/gemini-sweat-2.png',
    type: 'garment',
  },
  {
    id: 'gemini-tee',
    name: 'Gemini Tee',
    url: 'https://cdn.jsdelivr.net/gh/ammaarreshi/app-images@main/Gemini-tee.png',
    type: 'garment',
  }
];

export const defaultAccessories: WardrobeItem[] = [
    {
        id: 'gold-necklace',
        name: 'Gold Necklace',
        url: 'https://cdn.jsdelivr.net/gh/ammaarreshi/app-images@main/accessories/gold-necklace.png',
        type: 'accessory',
    },
    {
        id: 'sun-hat',
        name: 'Sun Hat',
        url: 'https://cdn.jsdelivr.net/gh/ammaarreshi/app-images@main/accessories/sun-hat.png',
        type: 'accessory',
    },
    {
        id: 'aviator-sunglasses',
        name: 'Aviators',
        url: 'https://cdn.jsdelivr.net/gh/ammaarreshi/app-images@main/accessories/aviator-sunglasses.png',
        type: 'accessory',
    }
];