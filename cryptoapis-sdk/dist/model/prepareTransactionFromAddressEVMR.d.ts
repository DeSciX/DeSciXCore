import { PrepareTransactionFromAddressEVMRData } from './prepareTransactionFromAddressEVMRData';
export declare class PrepareTransactionFromAddressEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': PrepareTransactionFromAddressEVMRData;
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
