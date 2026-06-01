import { ListConfirmedTokensTransfersByAddressEVMRData } from './listConfirmedTokensTransfersByAddressEVMRData';
export declare class ListConfirmedTokensTransfersByAddressEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': ListConfirmedTokensTransfersByAddressEVMRData;
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
