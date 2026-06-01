import { GetAddressBalanceEVME400 } from './getAddressBalanceEVME400';
export declare class GetAddressBalanceEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAddressBalanceEVME400;
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
