import { ListConfirmedTokensTransfersByAddressEVME403 } from './listConfirmedTokensTransfersByAddressEVME403';
export declare class ListConfirmedTokensTransfersByAddressEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTokensTransfersByAddressEVME403;
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
