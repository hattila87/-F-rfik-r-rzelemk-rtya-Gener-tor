import React from 'react';
import { CardData } from '../types';
import { DownloadIcon, ShareIcon, EditIcon } from './icons';
import Spinner from './Spinner';

interface CardProps {
    card: CardData;
    isBack?: boolean;
    onDownload?: () => void;
    onShare?: () => void;
    onEdit?: () => void;
}

const Card: React.FC<CardProps> = ({ card, isBack = false, onDownload, onShare, onEdit }) => {
    return (
        <div className="group relative aspect-[2/3] w-full bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 border-gray-700/50 transition-all duration-300 hover:shadow-amber-400/20 hover:border-amber-400/50">
            {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.emotion} className="w-full h-full object-cover" />
            ) : (
                <div className="flex items-center justify-center w-full h-full">
                    <Spinner />
                </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
                 {!isBack && <h3 className="text-white text-2xl font-bold text-center card-text">{card.emotion}</h3>}
            </div>

            {!isBack && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={onDownload} title="Letöltés" className="p-3 bg-amber-500/80 rounded-full hover:bg-amber-500 transition-colors">
                        <DownloadIcon className="w-6 h-6 text-gray-900" />
                    </button>
                    <button onClick={onShare} title="Megosztás" className="p-3 bg-amber-500/80 rounded-full hover:bg-amber-500 transition-colors">
                        <ShareIcon className="w-6 h-6 text-gray-900" />
                    </button>
                    <button onClick={onEdit} title="Szerkesztés" className="p-3 bg-amber-500/80 rounded-full hover:bg-amber-500 transition-colors">
                        <EditIcon className="w-6 h-6 text-gray-900" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Card;