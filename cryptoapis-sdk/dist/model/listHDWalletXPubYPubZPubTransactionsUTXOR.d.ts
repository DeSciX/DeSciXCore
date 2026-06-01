import { ListHDWalletXPubYPubZPubTransactionsUTXORData } from './listHDWalletXPubYPubZPubTransactionsUTXORData';
export declare class ListHDWalletXPubYPubZPubTransactionsUTXOR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListHDWalletXPubYPubZPubTransactionsUTXORData;
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
