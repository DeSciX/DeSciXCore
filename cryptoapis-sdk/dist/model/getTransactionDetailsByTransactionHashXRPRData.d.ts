import { GetTransactionDetailsByTransactionHashXRPRI } from './getTransactionDetailsByTransactionHashXRPRI';
export declare class GetTransactionDetailsByTransactionHashXRPRData {
    'item': GetTransactionDetailsByTransactionHashXRPRI;
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
