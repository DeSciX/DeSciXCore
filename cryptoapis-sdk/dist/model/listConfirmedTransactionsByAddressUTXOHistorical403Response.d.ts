import { ListConfirmedTransactionsByAddressUTXOHistoricalE403 } from './listConfirmedTransactionsByAddressUTXOHistoricalE403';
export declare class ListConfirmedTransactionsByAddressUTXOHistorical403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTransactionsByAddressUTXOHistoricalE403;
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
