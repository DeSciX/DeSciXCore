import { GetRawTransactionDataUTXOsRI } from './getRawTransactionDataUTXOsRI';
export declare class GetRawTransactionDataUTXOsRData {
    'item': GetRawTransactionDataUTXOsRI;
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
