import React, { useState } from 'react';
import { CardData } from '../types';
import Spinner from './Spinner';
import { blobToBase64 } from '../utils/fileUtils';

interface EditModalProps {
    card: CardData;
    onClose: () => void;
    onSave: (updatedCard: CardData) => void;
    editService: (base64Image: string, mimeType: string, prompt: string) => Promise<string>;
}

const EditModal: React.FC<EditModalProps> = ({ card, onClose, onSave, editService }) => {
    const [prompt, setPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleEdit = async () => {
        if (!prompt) {
            setError('Kérlek, adj meg egy szerkesztési utasítást.');
            return;
        }
        setIsEditing(true);
        setError(null);
        setEditedImageUrl(null);
        try {
            const response = await fetch(editedImageUrl || card.imageUrl);
            const blob = await response.blob();
            const base64Image = await blobToBase64(blob) as string;

            const editedImage = await editService(base64Image.split(',')[1], blob.type, prompt);
            setEditedImageUrl(editedImage);
        } catch (err) {
            console.error("Editing failed:", err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('A szerkesztés nem sikerült. Próbáld újra.');
            }
        } finally {
            setIsEditing(false);
        }
    };

    const handleSave = () => {
        if (editedImageUrl) {
            onSave({ ...card, imageUrl: editedImageUrl });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col md:flex-row gap-6 p-6" onClick={(e) => e.stopPropagation()}>
                {/* Image comparison section */}
                <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-gray-900 p-4 rounded-md">
                    <div>
                        <h3 className="text-lg font-semibold text-center text-gray-400 mb-2">Eredeti</h3>
                        <div className="aspect-[2/3] w-full bg-gray-800 rounded-md overflow-hidden">
                            <img src={card.originalImageUrl} alt={`Eredeti ${card.emotion}`} className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-center text-gray-400 mb-2">Szerkesztett</h3>
                        <div className="aspect-[2/3] w-full bg-gray-800 rounded-md flex items-center justify-center overflow-hidden">
                            {isEditing ? (
                                <Spinner />
                            ) : (
                                <img src={editedImageUrl || card.imageUrl} alt={`Szerkesztett ${card.emotion}`} className="w-full h-full object-contain" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls section */}
                <div className="flex-1 flex flex-col">
                    <h2 className="text-2xl font-bold text-amber-400 mb-4">Kép szerkesztése: {card.emotion}</h2>
                    <p className="text-gray-300 mb-4">Írd le, hogyan szeretnéd módosítani a képet.</p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition mb-4 flex-grow"
                        rows={4}
                        placeholder="Pl. Adj hozzá egy arany keretet..."
                        disabled={isEditing}
                    />
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    <div className="flex flex-col gap-3 mt-auto">
                        <button
                            onClick={handleEdit}
                            disabled={isEditing || !prompt}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-6 rounded-lg shadow-lg transition disabled:bg-gray-500/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isEditing && <Spinner className="w-5 h-5" />}
                            {isEditing ? 'Szerkesztés...' : 'Módosítások alkalmazása'}
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isEditing}
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition"
                            >
                                Mégse
                            </button>
                             <button
                                onClick={handleSave}
                                disabled={!editedImageUrl || isEditing}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition disabled:bg-gray-500/50 disabled:cursor-not-allowed"
                            >
                                Mentés
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditModal;