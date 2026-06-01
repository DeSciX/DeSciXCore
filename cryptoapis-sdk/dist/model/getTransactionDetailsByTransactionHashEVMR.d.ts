import { GetTransactionDetailsByTransactionHashEVMRData } from './getTransactionDetailsByTransactionHashEVMRData';
export declare class GetTransactionDetailsByTransactionHashEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetTransactionDetailsByTransactionHashEVMRData;
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
