import { ListHDWalletXPubYPubZPubTransactionsEVME422 } from './listHDWalletXPubYPubZPubTransactionsEVME422';
export declare class ListHDWalletXPubYPubZPubTransactionsEVM422Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListHDWalletXPubYPubZPubTransactionsEVME422;
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
