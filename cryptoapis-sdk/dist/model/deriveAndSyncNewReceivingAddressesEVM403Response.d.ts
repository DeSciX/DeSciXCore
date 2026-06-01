import { DeriveAndSyncNewReceivingAddressesEVME403 } from './deriveAndSyncNewReceivingAddressesEVME403';
export declare class DeriveAndSyncNewReceivingAddressesEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewReceivingAddressesEVME403;
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
