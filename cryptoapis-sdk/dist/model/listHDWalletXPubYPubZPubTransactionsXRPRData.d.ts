import { ListHDWalletXPubYPubZPubTransactionsXRPRI } from './listHDWalletXPubYPubZPubTransactionsXRPRI';
export declare class ListHDWalletXPubYPubZPubTransactionsXRPRData {
    'limit': number;
    'offset': number;
    'total': number;
    'items': Array<ListHDWalletXPubYPubZPubTransactionsXRPRI>;
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
