import { DeriveAndSyncNewReceivingAddressesEVMRData } from './deriveAndSyncNewReceivingAddressesEVMRData';
export declare class DeriveAndSyncNewReceivingAddressesEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DeriveAndSyncNewReceivingAddressesEVMRData;
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
