import { PrepareTransactionFromAddressEVME403 } from './prepareTransactionFromAddressEVME403';
export declare class PrepareTransactionFromAddressEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': PrepareTransactionFromAddressEVME403;
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
