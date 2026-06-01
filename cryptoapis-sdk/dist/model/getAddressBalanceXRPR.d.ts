import { GetAddressBalanceXRPRData } from './getAddressBalanceXRPRData';
export declare class GetAddressBalanceXRPR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': GetAddressBalanceXRPRData;
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
