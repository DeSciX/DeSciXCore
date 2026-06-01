import { DeriveAndSyncNewReceivingAddressesXRPRData } from './deriveAndSyncNewReceivingAddressesXRPRData';
export declare class DeriveAndSyncNewReceivingAddressesXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DeriveAndSyncNewReceivingAddressesXRPRData;
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
