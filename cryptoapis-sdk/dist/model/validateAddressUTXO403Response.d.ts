import { ValidateAddressUTXOE403 } from './validateAddressUTXOE403';
export declare class ValidateAddressUTXO403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ValidateAddressUTXOE403;
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
