import { PrepareTransactionFromAddressEVME401 } from './prepareTransactionFromAddressEVME401';
export declare class PrepareTransactionFromAddressEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': PrepareTransactionFromAddressEVME401;
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
