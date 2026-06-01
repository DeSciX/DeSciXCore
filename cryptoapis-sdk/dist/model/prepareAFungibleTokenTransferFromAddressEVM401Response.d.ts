import { PrepareAFungibleTokenTransferFromAddressEVME401 } from './prepareAFungibleTokenTransferFromAddressEVME401';
export declare class PrepareAFungibleTokenTransferFromAddressEVM401Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': PrepareAFungibleTokenTransferFromAddressEVME401;
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
