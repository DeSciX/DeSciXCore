import { DeriveAndSyncNewChangeAddressesUTXOE401 } from './deriveAndSyncNewChangeAddressesUTXOE401';
export declare class DeriveAndSyncNewChangeAddressesUTXO401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewChangeAddressesUTXOE401;
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
