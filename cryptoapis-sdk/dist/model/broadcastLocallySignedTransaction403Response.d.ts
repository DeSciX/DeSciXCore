import { BroadcastLocallySignedTransactionE403 } from './broadcastLocallySignedTransactionE403';
export declare class BroadcastLocallySignedTransaction403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': BroadcastLocallySignedTransactionE403;
    static discriminator: string | undefined;
    static attributeTypeMap: Array<{
        name: string;
        baseName: string;
        type: string;
    }>;
    static getAttributeTypeMap(): {
        name: string;
        baseName: string;
        type: string;
    }[];
}
