import React from 'react';
import { CardData } from '../types';

interface PrintLayoutProps {
    cards: CardData[];
    cardBack: string | null;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ cards, cardBack }) => {
    if (cards.length === 0 || !cardBack) return null;

    // A trailing comma is needed in the generic type <T,> to disambiguate
    // it from a JSX tag in .tsx files.
    const chunkArray = <T,>(array: T[], size: number): T[][] => {
        const result: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    };

    const cardChunks = chunkArray(cards, 4);
    const centerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.5cm',
    };

    return (
        <div id="print-area" className="hidden print:block">
            {cardChunks.map((chunk, pageIndex) => (
                <React.Fragment key={pageIndex}>
                    {/* Front page */}
                    <div className="print-page" style={centerStyle}>
                        <div style={gridStyle}>
                            {/* FIX: Add explicit type to `card` to resolve TypeScript inference error. */}
                            {chunk.map((card: CardData) => (
                                <div key={card.id} style={{ border: '1px dashed #ccc', width: '8cm', height: '12cm', position: 'relative', boxSizing: 'border-box' }}>
                                    <img src={card.imageUrl} alt={card.emotion} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, textAlign: 'center' }}>
                                        <h3 style={{ fontFamily: 'Roboto Slab, serif', color: '#FFD700', fontSize: '18pt', textShadow: '0 0 5px black' }}>
                                            {card.emotion}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                            {/* Fill empty slots on the last page */}
                            {Array(4 - chunk.length).fill(0).map((_, i) => (
                                <div key={`empty-${i}`} style={{ border: '1px dashed #ccc', width: '8cm', height: '12cm' }}></div>
                            ))}
                        </div>
                    </div>

                    {/* Back page */}
                    <div className="print-page" style={centerStyle}>
                        <div style={gridStyle}>
                            {Array(4).fill(0).map((_, i) => (
                                <div key={`back-${pageIndex}-${i}`} style={{ border: '1px dashed #ccc', width: '8cm', height: '12cm' }}>
                                    <img src={cardBack} alt="Hátlap" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};

export default PrintLayout;