import { DeriveAndSyncNewReceivingAddressesXRPE401 } from './deriveAndSyncNewReceivingAddressesXRPE401';
export declare class DeriveAndSyncNewReceivingAddressesXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewReceivingAddressesXRPE401;
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
