import { BroadcastLocallySignedTransactionRBData } from './broadcastLocallySignedTransactionRBData';
export declare class BroadcastLocallySignedTransactionRB {
    'context'?: string;
    'data': BroadcastLocallySignedTransactionRBData;
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
