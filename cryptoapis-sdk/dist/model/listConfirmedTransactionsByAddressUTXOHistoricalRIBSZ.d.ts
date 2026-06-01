import { ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZValueBalance } from './listConfirmedTransactionsByAddressUTXOHistoricalRIBSZValueBalance';
export declare class ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ {
    'expiryHeight': number;
    'overwintered': boolean;
    'valueBalance': ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZValueBalance;
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
