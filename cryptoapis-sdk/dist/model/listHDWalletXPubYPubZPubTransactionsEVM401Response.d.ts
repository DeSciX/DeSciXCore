import { ListHDWalletXPubYPubZPubTransactionsEVME401 } from './listHDWalletXPubYPubZPubTransactionsEVME401';
export declare class ListHDWalletXPubYPubZPubTransactionsEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListHDWalletXPubYPubZPubTransactionsEVME401;
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
