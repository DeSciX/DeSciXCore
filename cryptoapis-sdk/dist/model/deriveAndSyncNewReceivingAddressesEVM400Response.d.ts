import { DeriveAndSyncNewReceivingAddressesEVME400 } from './deriveAndSyncNewReceivingAddressesEVME400';
export declare class DeriveAndSyncNewReceivingAddressesEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewReceivingAddressesEVME400;
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
