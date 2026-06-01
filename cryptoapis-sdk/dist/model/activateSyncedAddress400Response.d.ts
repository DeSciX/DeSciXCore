import { ActivateSyncedAddressE400 } from './activateSyncedAddressE400';
export declare class ActivateSyncedAddress400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ActivateSyncedAddressE400;
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
