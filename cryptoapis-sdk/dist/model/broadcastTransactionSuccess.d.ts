import { BroadcastTransactionSuccessData } from './broadcastTransactionSuccessData';
export declare class BroadcastTransactionSuccess {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': BroadcastTransactionSuccessData;
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
