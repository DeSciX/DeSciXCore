import { PrepareTransactionFromAddressEVMRBData } from './prepareTransactionFromAddressEVMRBData';
export declare class PrepareTransactionFromAddressEVMRB {
    'context'?: string;
    'data': PrepareTransactionFromAddressEVMRBData;
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
