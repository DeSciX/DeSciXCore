import { GetAddressBalanceUTXOsE400 } from './getAddressBalanceUTXOsE400';
export declare class GetAddressBalanceUTXOs400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAddressBalanceUTXOsE400;
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
