import { BroadcastTransactionFailDataItem } from './broadcastTransactionFailDataItem';
export declare class BroadcastTransactionFailData {
    'product': string;
    'event': string;
    'item': BroadcastTransactionFailDataItem;
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
