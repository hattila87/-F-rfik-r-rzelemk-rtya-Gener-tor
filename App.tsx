
import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

import { CardData, GenerationStatus } from './types';
import Card from './components/Card';
import EditModal from './components/EditModal';
import PrintLayout from './components/PrintLayout';
import { generateImage, editImage } from './services/geminiService';
import { downloadCard } from './utils/fileUtils';

const App: React.FC = () => {
    const [emotionsInput, setEmotionsInput] = useState<string>('Düh, Öröm, Bánat, Félelem, Meglepetés, Undor');
    const [cards, setCards] = useState<CardData[]>([]);
    const [cardBack, setCardBack] = useState<string | null>(null);
    const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.Idle);
    const [editingCard, setEditingCard] = useState<CardData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isGeneratingRef = useRef(false);

    const handleGenerate = async () => {
        const emotions = emotionsInput.split(',').map(e => e.trim()).filter(Boolean);
        if (emotions.length === 0) {
            setError('Kérlek, adj meg legalább egy érzelmet.');
            return;
        }

        setStatus(GenerationStatus.Generating);
        setCards([]);
        setCardBack(null);
        setError(null);
        isGeneratingRef.current = true;

        try {
            // 1. Generate card back
            const backPrompt = "Egy arany Mars szimbólum művészi, mélykék texturált háttéren. Elegáns és letisztult dizájn, kártya hátlapnak tökéletes. Nyomdai minőség, 1890x2832 pixel, 600 DPI.";
            const backImage = await generateImage(backPrompt);
            setCardBack(backImage);

            // 2. Generate card fronts
            for (const emotion of emotions) {
                if (!isGeneratingRef.current) break;

                // Wait 5 seconds between generations to respect API limits
                await new Promise(resolve => setTimeout(resolve, 5000));

                if (!isGeneratingRef.current) break;
                
                try {
                    const frontPrompt = `Szimbolista festmény stílusú, rendkívül részletgazdag illusztráció. A téma egy férfias, európai mitológiai ihletésű allegorikus alak, aki a(z) '${emotion}' érzelmet testesíti meg. A kép az érzelem belső, spirituális élményét ragadja meg. Sötét tónusú színpaletta: mélykék, arany, fekete. Nyomdai minőség, 1890x2832 pixel, 600 DPI. FONTOS: A képen ne jelenjen meg semmilyen szöveg, betű vagy felirat.`;
                    const frontImage = await generateImage(frontPrompt);
                    
                    setCards(prev => [...prev, { id: crypto.randomUUID(), emotion, imageUrl: frontImage, originalImageUrl: frontImage }]);
                } catch (individualError) {
                    console.error(`Hiba a(z) '${emotion}' kártya generálása közben:`, individualError);
                    // Update the UI with a non-fatal error message, allowing the process to continue
                    setError(`A(z) "${emotion}" kártya generálása sikertelen volt. A folyamat folytatódik a következővel.`);
                    // The loop will continue to the next iteration.
                }
            }

        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Ismeretlen hiba történt a generálás során.');
            }
        } finally {
            setStatus(GenerationStatus.Idle);
            isGeneratingRef.current = false;
        }
    };

    const handleStop = () => {
        isGeneratingRef.current = false;
        setStatus(GenerationStatus.Idle);
    };
    
    const handlePrint = () => {
        const printArea = document.getElementById('print-area');
        if (!printArea) {
            setError("Hiba: A nyomtatási terület nem található.");
            return;
        }

        const printNode = printArea.cloneNode(true) as HTMLElement;
        printNode.classList.remove('hidden', 'print:block');

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            setError("A felugró ablakok blokkolva vannak. Kérlek, engedélyezd a felugró ablakokat az oldal számára a nyomtatáshoz.");
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Nyomtatás - Férfi Érzelemkártyák</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        @page {
                            size: A4;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            font-family: 'Roboto Slab', serif;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .print-page {
                            page-break-after: always;
                            width: 210mm;
                            height: 297mm;
                            box-sizing: border-box;
                            overflow: hidden;
                        }
                    </style>
                </head>
                <body>
                    ${printNode.innerHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };
    };

    const handleUpdateCard = (updatedCard: CardData) => {
        setCards(prev => prev.map(card => card.id === updatedCard.id ? updatedCard : card));
        setEditingCard(null);
    };
    
    const handleShare = async (card: CardData) => {
        try {
            const response = await fetch(card.imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `${card.emotion}.png`, { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Érzelemkártya: ${card.emotion}`,
                    text: `Ez egy '${card.emotion}' érzelemkártya.`,
                    files: [file],
                });
            } else {
                alert('A böngésződ nem támogatja a fájlok megosztását.');
            }
        } catch (error) {
            console.error('Hiba a megosztás során:', error);
            alert('Hiba történt a kártya megosztása közben.');
        }
    };


    return (
        <>
            <div className="bg-gray-900 text-white min-h-screen print:hidden">
                <div className="container mx-auto p-4 md:p-8">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold text-amber-400" style={{ textShadow: '0 0 10px #f59e0b' }}>Férfi Érzelemkártya Generátor</h1>
                        <p className="text-gray-300 mt-2 max-w-2xl mx-auto">Generálj egyedi, nyomtatható érzelemkártyákat európai mitológiai stílusban.</p>
                    </header>

                    <main>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-2xl mb-8 max-w-3xl mx-auto">
                            <label htmlFor="emotions" className="block text-lg font-semibold mb-2 text-amber-300">Érzelmek (vesszővel elválasztva)</label>
                            <textarea
                                id="emotions"
                                value={emotionsInput}
                                onChange={(e) => setEmotionsInput(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                                rows={3}
                                placeholder="Pl. Düh, Öröm, Bánat..."
                                disabled={status === GenerationStatus.Generating}
                            />
                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                {status !== GenerationStatus.Generating ? (
                                    <button
                                        onClick={handleGenerate}
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                                    >
                                        Kártyák generálása
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStop}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                                    >
                                        Generálás leállítása
                                    </button>
                                )}
                                {cards.length > 0 && (
                                    <button
                                        onClick={handlePrint}
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                                    >
                                        Nyomtatás
                                    </button>
                                )}
                            </div>
                            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                        </div>

                        {status === GenerationStatus.Generating && (
                            <div className="text-center my-8">
                                <p className="text-xl text-amber-300 animate-pulse">Generálás folyamatban... Kérlek, várj.</p>
                                <p className="text-gray-400">Ez több percig is eltarthat a kártyák számától függően.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {cardBack && <Card card={{ id: 'back', emotion: 'Hátlap', imageUrl: cardBack, originalImageUrl: cardBack }} isBack />}
                            {cards.map(card => (
                                <Card
                                    key={card.id}
                                    card={card}
                                    onDownload={() => downloadCard(card)}
                                    onShare={() => handleShare(card)}
                                    onEdit={() => setEditingCard(card)}
                                />
                            ))}
                        </div>
                    </main>
                </div>
                
                {editingCard && (
                    <EditModal
                        card={editingCard}
                        onClose={() => setEditingCard(null)}
                        onSave={handleUpdateCard}
                        editService={editImage}
                    />
                )}
            </div>

            <PrintLayout cards={cards} cardBack={cardBack} />
        </>
    );
};

export default App;
