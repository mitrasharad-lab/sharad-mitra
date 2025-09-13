/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import { generateVirtualTryOnImage, generatePoseVariation, generateColorVariation, generateAccessoryTryOnImage } from './services/geminiService';
import { OutfitLayer, WardrobeItem, SavedOutfit } from './types';
import { ChevronDownIcon, ChevronUpIcon, BookmarkIcon } from './components/icons';
import { defaultWardrobe, defaultAccessories } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';
import SavedOutfitsPanel from './components/SavedOutfitsPanel';
import ColorPickerModal from './components/ColorPickerModal';
import LookbookModal from './components/LookbookModal';

const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
];

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    // DEPRECATED: mediaQueryList.addListener(listener);
    mediaQueryList.addEventListener('change', listener);
    
    // Check again on mount in case it changed between initial state and effect runs
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      // DEPRECATED: mediaQueryList.removeListener(listener);
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};


const App: React.FC = () => {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [accessories, setAccessories] = useState<WardrobeItem[]>(defaultAccessories);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isLookbookOpen, setIsLookbookOpen] = useState(false);
  const [selectedLayerIndexForRecolor, setSelectedLayerIndexForRecolor] = useState<number | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    try {
        const storedOutfits = localStorage.getItem('virtual-try-on-saved-outfits');
        if (storedOutfits) {
            setSavedOutfits(JSON.parse(storedOutfits));
        }
    } catch (e) {
        console.error("Failed to load saved outfits from localStorage", e);
    }
  }, []);

  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeItemIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.item?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    // Return the image for the current pose, or fallback to the first available image for the current layer.
    // This ensures an image is shown even while a new pose is generating.
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return [];
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [outfitHistory, currentOutfitIndex]);

  const handleModelFinalized = (url: string) => {
    setModelImageUrl(url);
    setOutfitHistory([{
      item: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: url }
    }]);
    setCurrentOutfitIndex(0);
  };

  const handleStartOver = () => {
    setModelImageUrl(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentPoseIndex(0);
    setIsSheetCollapsed(false);
    setWardrobe(defaultWardrobe);
    setAccessories(defaultAccessories);
  };

  const handleItemSelect = useCallback(async (itemFile: File, itemInfo: WardrobeItem) => {
    if (!displayImageUrl || isLoading) return;

    // Caching: Check if we are re-applying a previously generated layer
    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.item?.id === itemInfo.id) {
        setCurrentOutfitIndex(prev => prev + 1);
        setCurrentPoseIndex(0); // Reset pose when changing layer
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Adding ${itemInfo.name}...`);

    try {
      const newImageUrl = itemInfo.type === 'garment'
        ? await generateVirtualTryOnImage(displayImageUrl, itemFile)
        : await generateAccessoryTryOnImage(displayImageUrl, itemFile);

      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      
      const newLayer: OutfitLayer = { 
        item: itemInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl } 
      };

      setOutfitHistory(prevHistory => {
        // Cut the history at the current point before adding the new layer
        const newHistory = prevHistory.slice(0, currentOutfitIndex + 1);
        return [...newHistory, newLayer];
      });
      setCurrentOutfitIndex(prev => prev + 1);
      
      // Add to personal wardrobe if it's not already there
      const listUpdater = itemInfo.type === 'garment' ? setWardrobe : setAccessories;
      listUpdater(prev => {
        if (prev.find(item => item.id === itemInfo.id)) {
            return prev;
        }
        return [...prev, itemInfo];
      });

    } catch (err) {
      setError(getFriendlyErrorMessage(err, `Failed to apply ${itemInfo.type}`));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, currentPoseIndex, outfitHistory, currentOutfitIndex]);

  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0) {
      setCurrentOutfitIndex(prevIndex => prevIndex - 1);
      setCurrentPoseIndex(0); // Reset pose to default when removing a layer
    }
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    // If pose already exists, just update the index to show it.
    if (currentLayer.poseImages[poseInstruction]) {
      setCurrentPoseIndex(newIndex);
      return;
    }

    // Pose doesn't exist, so generate it.
    // Use an existing image from the current layer as the base.
    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return; // Should not happen

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Changing pose...`);
    
    const prevPoseIndex = currentPoseIndex;
    // Optimistically update the pose index so the pose name changes in the UI
    setCurrentPoseIndex(newIndex);

    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const updatedLayer = newHistory[currentOutfitIndex];
        updatedLayer.poseImages[poseInstruction] = newImageUrl;
        return newHistory;
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to change pose'));
      // Revert pose index on failure
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex]);
  
  const handleSaveOutfit = useCallback(() => {
    if (outfitHistory.length <= 1 || !displayImageUrl || !modelImageUrl) {
        alert("Please add at least one item to save an outfit.");
        return;
    }
    const name = window.prompt('Enter a name for your outfit:');
    if (name) {
        const newOutfit: SavedOutfit = {
            id: Date.now().toString(),
            name,
            previewImageUrl: displayImageUrl,
            modelImageUrl: modelImageUrl,
            layers: outfitHistory,
        };
        const updatedOutfits = [...savedOutfits, newOutfit];
        setSavedOutfits(updatedOutfits);
        localStorage.setItem('virtual-try-on-saved-outfits', JSON.stringify(updatedOutfits));
        alert(`Outfit "${name}" saved!`);
    }
  }, [outfitHistory, displayImageUrl, modelImageUrl, savedOutfits]);

  const handleLoadOutfit = useCallback((outfit: SavedOutfit) => {
    if (window.confirm('Loading this outfit will replace your current one. Continue?')) {
        setModelImageUrl(outfit.modelImageUrl);
        setOutfitHistory(outfit.layers);
        setCurrentOutfitIndex(outfit.layers.length - 1);
        setCurrentPoseIndex(0);
        setError(null);
        setIsSheetCollapsed(false); // Ensure panel is visible
    }
  }, []);

  const handleDeleteOutfit = useCallback((outfitId: string) => {
    if (window.confirm('Are you sure you want to delete this outfit? This action cannot be undone.')) {
        const updatedOutfits = savedOutfits.filter(o => o.id !== outfitId);
        setSavedOutfits(updatedOutfits);
        localStorage.setItem('virtual-try-on-saved-outfits', JSON.stringify(updatedOutfits));
    }
  }, [savedOutfits]);

  const handleOpenColorPicker = (layerIndex: number) => {
    setSelectedLayerIndexForRecolor(layerIndex);
    setIsColorPickerOpen(true);
  };

  const handleRecolorGarment = useCallback(async (colorName: string) => {
    if (selectedLayerIndexForRecolor === null || !displayImageUrl) return;

    const layerToRecolor = outfitHistory[selectedLayerIndexForRecolor];
    if (!layerToRecolor || !layerToRecolor.item) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Recoloring to ${colorName}...`);

    try {
        const newImageUrl = await generateColorVariation(displayImageUrl, layerToRecolor.item.name, colorName);
        const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];

        setOutfitHistory(prevHistory => {
            const newHistory = prevHistory.map((layer, index) => {
                if (index === selectedLayerIndexForRecolor) {
                    // Create a new layer object with the updated pose image
                    // This also clears any other poses for this layer, as they are now invalid
                    return {
                        ...layer,
                        poseImages: { [currentPoseInstruction]: newImageUrl }
                    };
                }
                return layer;
            });
            return newHistory;
        });

    } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Failed to recolor item'));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
        setIsColorPickerOpen(false);
        setSelectedLayerIndexForRecolor(null);
    }
  }, [selectedLayerIndexForRecolor, displayImageUrl, outfitHistory, currentPoseIndex]);

  const selectedItemForRecolor = useMemo(() => {
    if (selectedLayerIndexForRecolor === null) return null;
    return outfitHistory[selectedLayerIndexForRecolor]?.item ?? null;
  }, [selectedLayerIndexForRecolor, outfitHistory]);

  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="font-sans">
      <AnimatePresence mode="wait">
        {!modelImageUrl ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-gray-50 p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onModelFinalized={handleModelFinalized} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-white overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white pb-16 relative">
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={availablePoseKeys}
                />
              </div>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-gray-200/60 transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-8 flex items-center justify-center bg-gray-100/50"
                    aria-label={isSheetCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >
                    {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-500" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500" />}
                  </button>
                  <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-8">
                    {error && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                      </div>
                    )}
                    <OutfitStack 
                      outfitHistory={activeOutfitLayers}
                      onRemoveLastGarment={handleRemoveLastGarment}
                      onRecolorGarment={handleOpenColorPicker}
                    />
                    <button
                      onClick={handleSaveOutfit}
                      disabled={outfitHistory.length <= 1 || isLoading}
                      className="w-full flex items-center justify-center text-center bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out hover:bg-gray-700 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <BookmarkIcon className="w-5 h-5 mr-2" />
                      Save Current Outfit
                    </button>
                    
                    <SavedOutfitsPanel 
                        savedOutfits={savedOutfits}
                        onLoadOutfit={handleLoadOutfit}
                        onDeleteOutfit={handleDeleteOutfit}
                        onCreateLookbook={() => setIsLookbookOpen(true)}
                        isLoading={isLoading}
                    />

                    <WardrobePanel 
                      onItemSelect={handleItemSelect}
                      activeItemIds={activeItemIds}
                      isLoading={isLoading}
                      wardrobe={wardrobe}
                      accessories={accessories}
                    />
                  </div>
              </aside>
            </main>
            
            <Footer isOnDressingScreen={true} />
            
            <ColorPickerModal 
                isOpen={isColorPickerOpen}
                onClose={() => setIsColorPickerOpen(false)}
                onColorSelect={handleRecolorGarment}
                garment={selectedItemForRecolor}
            />
            
            <LookbookModal 
                isOpen={isLookbookOpen}
                onClose={() => setIsLookbookOpen(false)}
                savedOutfits={savedOutfits}
            />
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;