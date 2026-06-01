import { ListTransactionsByBlockHashUTXOsRIBSZValueBalance } from './listTransactionsByBlockHashUTXOsRIBSZValueBalance';
export declare class ListTransactionsByBlockHashUTXOsRIBSZ {
    'expiryHeight': number;
    'overwintered': boolean;
    'valueBalance': ListTransactionsByBlockHashUTXOsRIBSZValueBalance;
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
