import { DeriveAndSyncNewReceivingAddressesXRPE403 } from './deriveAndSyncNewReceivingAddressesXRPE403';
export declare class DeriveAndSyncNewReceivingAddressesXRP403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewReceivingAddressesXRPE403;
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
