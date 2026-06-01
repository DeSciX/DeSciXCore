import { PrepareAFungibleTokenTransferFromAddressEVME403 } from './prepareAFungibleTokenTransferFromAddressEVME403';
export declare class PrepareAFungibleTokenTransferFromAddressEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': PrepareAFungibleTokenTransferFromAddressEVME403;
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
