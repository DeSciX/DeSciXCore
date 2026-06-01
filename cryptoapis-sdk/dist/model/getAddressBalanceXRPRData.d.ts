import { GetAddressBalanceXRPRI } from './getAddressBalanceXRPRI';
export declare class GetAddressBalanceXRPRData {
    'item': GetAddressBalanceXRPRI;
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
