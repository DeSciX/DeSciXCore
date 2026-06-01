import { ListConfirmedTokensTransfersByAddressEVME401 } from './listConfirmedTokensTransfersByAddressEVME401';
export declare class ListConfirmedTokensTransfersByAddressEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': ListConfirmedTokensTransfersByAddressEVME401;
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
