import { CardData } from '../types';

export const blobToBase64 = (blob: Blob): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const downloadCard = async (card: CardData): Promise<void> => {
    try {
        // Ensure the custom font is loaded before drawing on the canvas
        await document.fonts.load('bold 120px "Roboto Slab"');
    } catch (err) {
        console.warn('Font could not be loaded, continuing with default font.', err);
    }
    
    const canvas = document.createElement('canvas');
    // Dimensions from the prompt: 1890 x 2832 px
    canvas.width = 1890;
    canvas.height = 2832;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const image = new Image();
    image.crossOrigin = 'anonymous'; 
    image.src = card.imageUrl;

    image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Styling the text
        ctx.font = 'bold 120px "Roboto Slab"';
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Adding a shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 10;
        
        // Position text at the bottom
        ctx.fillText(card.emotion, canvas.width / 2, canvas.height - 80);

        const link = document.createElement('a');
        link.download = `${card.emotion.replace(/\s+/g, '_')}_kártya.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    image.onerror = () => {
        alert("Hiba történt a kép letöltése közben. Próbálja meg a kártya képére jobb gombbal kattintva menteni.");
    };
};