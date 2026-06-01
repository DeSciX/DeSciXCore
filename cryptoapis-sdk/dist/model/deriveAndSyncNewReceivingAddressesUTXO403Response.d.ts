import { DeriveAndSyncNewReceivingAddressesUTXOE403 } from './deriveAndSyncNewReceivingAddressesUTXOE403';
export declare class DeriveAndSyncNewReceivingAddressesUTXO403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewReceivingAddressesUTXOE403;
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
