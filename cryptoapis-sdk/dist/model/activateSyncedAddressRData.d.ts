import { ActivateSyncedAddressRI } from './activateSyncedAddressRI';
export declare class ActivateSyncedAddressRData {
    'item': ActivateSyncedAddressRI;
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
