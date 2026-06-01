import { BannedIpAddressDetailsInner } from './bannedIpAddressDetailsInner';
export declare class ListConfirmedTransactionsByAddressEVMHistoryE400 {
    'code': string;
    'message': string;
    'details'?: Array<BannedIpAddressDetailsInner>;
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
