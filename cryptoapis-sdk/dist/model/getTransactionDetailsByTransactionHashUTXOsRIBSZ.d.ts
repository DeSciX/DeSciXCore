import { GetTransactionDetailsByTransactionHashUTXOsRIBSZValueBalance } from './getTransactionDetailsByTransactionHashUTXOsRIBSZValueBalance';
export declare class GetTransactionDetailsByTransactionHashUTXOsRIBSZ {
    'expiryHeight': number;
    'overwintered': boolean;
    'valueBalance': GetTransactionDetailsByTransactionHashUTXOsRIBSZValueBalance;
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
