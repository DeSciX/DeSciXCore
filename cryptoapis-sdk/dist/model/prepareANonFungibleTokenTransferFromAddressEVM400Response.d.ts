import { PrepareANonFungibleTokenTransferFromAddressEVME400 } from './prepareANonFungibleTokenTransferFromAddressEVME400';
export declare class PrepareANonFungibleTokenTransferFromAddressEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': PrepareANonFungibleTokenTransferFromAddressEVME400;
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
