import { GetTransactionDetailsByTransactionHashEVMRIBSESignatureData } from './getTransactionDetailsByTransactionHashEVMRIBSESignatureData';
export declare class GetTransactionDetailsByTransactionHashEVMRIBSE {
    'signatureData'?: GetTransactionDetailsByTransactionHashEVMRIBSESignatureData;
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
