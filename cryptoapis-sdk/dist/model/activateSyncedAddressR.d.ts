import { ActivateSyncedAddressRData } from './activateSyncedAddressRData';
export declare class ActivateSyncedAddressR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ActivateSyncedAddressRData;
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
