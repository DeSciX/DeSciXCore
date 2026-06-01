import { ListHDWalletXPubYPubZPubTransactionsEVMRData } from './listHDWalletXPubYPubZPubTransactionsEVMRData';
export declare class ListHDWalletXPubYPubZPubTransactionsEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListHDWalletXPubYPubZPubTransactionsEVMRData;
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
