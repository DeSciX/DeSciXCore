import { ListHDWalletXPubYPubZPubTransactionsUTXOE422 } from './listHDWalletXPubYPubZPubTransactionsUTXOE422';
export declare class ListHDWalletXPubYPubZPubTransactionsUTXO422Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListHDWalletXPubYPubZPubTransactionsUTXOE422;
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
