import { ListUnconfirmedTransactionsByAddressUTXOsRIBSZValueBalance } from './listUnconfirmedTransactionsByAddressUTXOsRIBSZValueBalance';
export declare class ListUnconfirmedTransactionsByAddressUTXOsRIBSZ {
    'expiryHeight': number;
    'overwintered': boolean;
    'valueBalance': ListUnconfirmedTransactionsByAddressUTXOsRIBSZValueBalance;
    'versionGroupId': string;
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
