
export interface CardData {
    id: string;
    emotion: string;
    imageUrl: string;
    originalImageUrl: string;
}

export enum GenerationStatus {
    Idle = 'idle',
    Generating = 'generating',
}
