import { DeriveAndSyncNewReceivingAddressesXRPE400 } from './deriveAndSyncNewReceivingAddressesXRPE400';
export declare class DeriveAndSyncNewReceivingAddressesXRP400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewReceivingAddressesXRPE400;
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
