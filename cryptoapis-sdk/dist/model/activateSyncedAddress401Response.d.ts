import { ActivateSyncedAddressE401 } from './activateSyncedAddressE401';
export declare class ActivateSyncedAddress401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ActivateSyncedAddressE401;
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
