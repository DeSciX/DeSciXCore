import { BroadcastLocallySignedTransactionE400 } from './broadcastLocallySignedTransactionE400';
export declare class BroadcastLocallySignedTransaction400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': BroadcastLocallySignedTransactionE400;
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
