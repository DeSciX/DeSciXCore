import { ListHDWalletXPubYPubZPubTransactionsXRPE400 } from './listHDWalletXPubYPubZPubTransactionsXRPE400';
export declare class ListHDWalletXPubYPubZPubTransactionsXRP400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListHDWalletXPubYPubZPubTransactionsXRPE400;
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
