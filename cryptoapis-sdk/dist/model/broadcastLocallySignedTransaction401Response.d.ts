import { BroadcastLocallySignedTransactionE401 } from './broadcastLocallySignedTransactionE401';
export declare class BroadcastLocallySignedTransaction401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': BroadcastLocallySignedTransactionE401;
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
