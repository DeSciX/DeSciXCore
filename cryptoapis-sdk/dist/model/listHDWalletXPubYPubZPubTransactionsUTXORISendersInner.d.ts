import { ListHDWalletXPubYPubZPubTransactionsUTXORISendersInnerValue } from './listHDWalletXPubYPubZPubTransactionsUTXORISendersInnerValue';
export declare class ListHDWalletXPubYPubZPubTransactionsUTXORISendersInner {
    'address': string;
    'isMember': boolean;
    'value': ListHDWalletXPubYPubZPubTransactionsUTXORISendersInnerValue;
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
