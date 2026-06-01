import { ListTokensByAddressSyncedEVME403 } from './listTokensByAddressSyncedEVME403';
export declare class ListTokensByAddressSyncedEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTokensByAddressSyncedEVME403;
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
