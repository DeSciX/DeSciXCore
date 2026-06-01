import { ListTransactionsByBlockHeightUTXOsRIBSZValueBalance } from './listTransactionsByBlockHeightUTXOsRIBSZValueBalance';
export declare class ListTransactionsByBlockHeightUTXOsRIBSZ {
    'expiryHeight': number;
    'overwintered': boolean;
    'valueBalance': ListTransactionsByBlockHeightUTXOsRIBSZValueBalance;
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
