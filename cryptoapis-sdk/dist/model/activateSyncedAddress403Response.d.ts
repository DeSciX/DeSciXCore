import { ActivateSyncedAddressE403 } from './activateSyncedAddressE403';
export declare class ActivateSyncedAddress403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ActivateSyncedAddressE403;
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
