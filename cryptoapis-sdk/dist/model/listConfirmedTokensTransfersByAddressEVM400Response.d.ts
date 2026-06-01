import { ListConfirmedTokensTransfersByAddressEVME400 } from './listConfirmedTokensTransfersByAddressEVME400';
export declare class ListConfirmedTokensTransfersByAddressEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTokensTransfersByAddressEVME400;
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
