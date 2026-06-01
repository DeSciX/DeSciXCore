import { DeriveAndSyncNewChangeAddressesUTXOE400 } from './deriveAndSyncNewChangeAddressesUTXOE400';
export declare class DeriveAndSyncNewChangeAddressesUTXO400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': DeriveAndSyncNewChangeAddressesUTXOE400;
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
