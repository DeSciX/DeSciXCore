import { PrepareANonFungibleTokenTransferFromAddressEVME403 } from './prepareANonFungibleTokenTransferFromAddressEVME403';
export declare class PrepareANonFungibleTokenTransferFromAddressEVM403Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': PrepareANonFungibleTokenTransferFromAddressEVME403;
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
