import { ListTokensByAddressSyncedEVME400 } from './listTokensByAddressSyncedEVME400';
export declare class ListTokensByAddressSyncedEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListTokensByAddressSyncedEVME400;
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
