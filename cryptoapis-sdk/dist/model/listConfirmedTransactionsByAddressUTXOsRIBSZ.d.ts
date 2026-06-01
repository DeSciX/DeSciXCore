import { ListConfirmedTransactionsByAddressUTXOsRIBSZValueBalance } from './listConfirmedTransactionsByAddressUTXOsRIBSZValueBalance';
export declare class ListConfirmedTransactionsByAddressUTXOsRIBSZ {
    'expiryHeight': number;
    'overwintered': boolean;
    'valueBalance': ListConfirmedTransactionsByAddressUTXOsRIBSZValueBalance;
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
