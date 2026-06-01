import { PrepareAFungibleTokenTransferFromAddressEVME400 } from './prepareAFungibleTokenTransferFromAddressEVME400';
export declare class PrepareAFungibleTokenTransferFromAddressEVM400Response {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'error': PrepareAFungibleTokenTransferFromAddressEVME400;
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
