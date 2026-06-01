import { DeriveAndSyncNewChangeAddressesUTXORData } from './deriveAndSyncNewChangeAddressesUTXORData';
export declare class DeriveAndSyncNewChangeAddressesUTXOR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': DeriveAndSyncNewChangeAddressesUTXORData;
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
