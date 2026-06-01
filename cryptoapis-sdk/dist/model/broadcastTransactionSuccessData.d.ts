import { BroadcastTransactionSuccessDataItem } from './broadcastTransactionSuccessDataItem';
export declare class BroadcastTransactionSuccessData {
    'product': string;
    'event': string;
    'item': BroadcastTransactionSuccessDataItem;
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
