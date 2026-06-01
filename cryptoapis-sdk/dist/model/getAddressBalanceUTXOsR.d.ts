import { GetAddressBalanceUTXOsRData } from './getAddressBalanceUTXOsRData';
export declare class GetAddressBalanceUTXOsR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetAddressBalanceUTXOsRData;
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
