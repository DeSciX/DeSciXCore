import { ListHDWalletXPubYPubZPubTransactionsUTXOE400 } from './listHDWalletXPubYPubZPubTransactionsUTXOE400';
export declare class ListHDWalletXPubYPubZPubTransactionsUTXO400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListHDWalletXPubYPubZPubTransactionsUTXOE400;
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
