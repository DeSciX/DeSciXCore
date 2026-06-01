import { GetAddressBalanceKaspaRData } from './getAddressBalanceKaspaRData';
export declare class GetAddressBalanceKaspaR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetAddressBalanceKaspaRData;
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
