import { ListHDWalletXPubYPubZPubTransactionsUTXOE401 } from './listHDWalletXPubYPubZPubTransactionsUTXOE401';
export declare class ListHDWalletXPubYPubZPubTransactionsUTXO401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListHDWalletXPubYPubZPubTransactionsUTXOE401;
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
