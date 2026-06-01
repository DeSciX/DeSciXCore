import { ValidateAddressUTXOE401 } from './validateAddressUTXOE401';
export declare class ValidateAddressUTXO401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ValidateAddressUTXOE401;
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
