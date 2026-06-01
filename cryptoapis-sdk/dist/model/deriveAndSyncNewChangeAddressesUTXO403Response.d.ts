import { DeriveAndSyncNewChangeAddressesUTXOE403 } from './deriveAndSyncNewChangeAddressesUTXOE403';
export declare class DeriveAndSyncNewChangeAddressesUTXO403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewChangeAddressesUTXOE403;
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
