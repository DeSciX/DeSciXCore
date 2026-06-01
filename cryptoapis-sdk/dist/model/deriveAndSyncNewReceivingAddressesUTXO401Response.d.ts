import { DeriveAndSyncNewReceivingAddressesUTXOE401 } from './deriveAndSyncNewReceivingAddressesUTXOE401';
export declare class DeriveAndSyncNewReceivingAddressesUTXO401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewReceivingAddressesUTXOE401;
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
