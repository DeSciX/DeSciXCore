import { GetAddressStatisticsUTXOsRITransactionCounts } from './getAddressStatisticsUTXOsRITransactionCounts';
export declare class GetAddressStatisticsUTXOsRI {
    'address': string;
    'blockHeight': number;
    'blockTimestamp': number;
    'transactionCounts': GetAddressStatisticsUTXOsRITransactionCounts;
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
