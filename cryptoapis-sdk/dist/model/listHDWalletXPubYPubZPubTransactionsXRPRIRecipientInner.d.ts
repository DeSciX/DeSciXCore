import { ListHDWalletXPubYPubZPubTransactionsXRPRIRecipientInnerValue } from './listHDWalletXPubYPubZPubTransactionsXRPRIRecipientInnerValue';
export declare class ListHDWalletXPubYPubZPubTransactionsXRPRIRecipientInner {
    'address': string;
    'isMember': boolean;
    'value': ListHDWalletXPubYPubZPubTransactionsXRPRIRecipientInnerValue;
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
