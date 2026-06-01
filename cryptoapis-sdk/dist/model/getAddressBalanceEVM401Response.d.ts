import { GetAddressBalanceEVME401 } from './getAddressBalanceEVME401';
export declare class GetAddressBalanceEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': GetAddressBalanceEVME401;
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
