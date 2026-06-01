import { DeriveAndSyncNewReceivingAddressesUTXOE400 } from './deriveAndSyncNewReceivingAddressesUTXOE400';
export declare class DeriveAndSyncNewReceivingAddressesUTXO400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewReceivingAddressesUTXOE400;
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
