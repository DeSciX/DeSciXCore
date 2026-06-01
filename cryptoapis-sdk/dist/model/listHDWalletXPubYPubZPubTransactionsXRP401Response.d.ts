import { ListHDWalletXPubYPubZPubTransactionsXRPE401 } from './listHDWalletXPubYPubZPubTransactionsXRPE401';
export declare class ListHDWalletXPubYPubZPubTransactionsXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListHDWalletXPubYPubZPubTransactionsXRPE401;
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
