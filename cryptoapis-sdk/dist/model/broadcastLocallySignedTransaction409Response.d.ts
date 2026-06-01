import { BroadcastLocallySignedTransactionE409 } from './broadcastLocallySignedTransactionE409';
export declare class BroadcastLocallySignedTransaction409Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': BroadcastLocallySignedTransactionE409;
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
