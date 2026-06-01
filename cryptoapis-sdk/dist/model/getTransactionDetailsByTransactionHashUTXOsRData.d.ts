import { GetTransactionDetailsByTransactionHashUTXOsRI } from './getTransactionDetailsByTransactionHashUTXOsRI';
export declare class GetTransactionDetailsByTransactionHashUTXOsRData {
    'item': GetTransactionDetailsByTransactionHashUTXOsRI;
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
