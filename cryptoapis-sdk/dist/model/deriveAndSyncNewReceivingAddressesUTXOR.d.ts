import { DeriveAndSyncNewReceivingAddressesUTXORData } from './deriveAndSyncNewReceivingAddressesUTXORData';
export declare class DeriveAndSyncNewReceivingAddressesUTXOR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DeriveAndSyncNewReceivingAddressesUTXORData;
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
