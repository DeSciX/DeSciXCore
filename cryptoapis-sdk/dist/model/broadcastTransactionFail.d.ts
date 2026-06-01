import { BroadcastTransactionFailData } from './broadcastTransactionFailData';
export declare class BroadcastTransactionFail {
    'apiVersion': string;
    'referenceId': string;
    'idempotencyKey': string;
    'data': BroadcastTransactionFailData;
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
