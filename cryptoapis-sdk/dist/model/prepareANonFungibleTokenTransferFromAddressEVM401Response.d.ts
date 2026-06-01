import { PrepareANonFungibleTokenTransferFromAddressEVME401 } from './prepareANonFungibleTokenTransferFromAddressEVME401';
export declare class PrepareANonFungibleTokenTransferFromAddressEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': PrepareANonFungibleTokenTransferFromAddressEVME401;
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
