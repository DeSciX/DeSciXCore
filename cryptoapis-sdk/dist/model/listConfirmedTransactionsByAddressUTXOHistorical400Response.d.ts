import { ListConfirmedTransactionsByAddressUTXOHistoricalE400 } from './listConfirmedTransactionsByAddressUTXOHistoricalE400';
export declare class ListConfirmedTransactionsByAddressUTXOHistorical400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressUTXOHistoricalE400;
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
