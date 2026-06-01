import { ValidateAddressUTXOE400 } from './validateAddressUTXOE400';
export declare class ValidateAddressUTXO400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ValidateAddressUTXOE400;
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
