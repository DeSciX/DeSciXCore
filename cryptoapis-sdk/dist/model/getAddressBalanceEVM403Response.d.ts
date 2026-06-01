import { GetAddressBalanceEVME403 } from './getAddressBalanceEVME403';
export declare class GetAddressBalanceEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAddressBalanceEVME403;
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
