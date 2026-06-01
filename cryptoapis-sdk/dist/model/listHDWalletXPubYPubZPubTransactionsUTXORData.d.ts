import { ListHDWalletXPubYPubZPubTransactionsUTXORI } from './listHDWalletXPubYPubZPubTransactionsUTXORI';
export declare class ListHDWalletXPubYPubZPubTransactionsUTXORData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListHDWalletXPubYPubZPubTransactionsUTXORI>;
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
