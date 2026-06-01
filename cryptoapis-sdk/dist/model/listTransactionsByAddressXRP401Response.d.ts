import { ListTransactionsByAddressXRPE401 } from './listTransactionsByAddressXRPE401';
export declare class ListTransactionsByAddressXRP401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTransactionsByAddressXRPE401;
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
