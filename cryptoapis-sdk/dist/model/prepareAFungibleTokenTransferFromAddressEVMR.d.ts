import { PrepareAFungibleTokenTransferFromAddressEVMRData } from './prepareAFungibleTokenTransferFromAddressEVMRData';
export declare class PrepareAFungibleTokenTransferFromAddressEVMR {
    'apiVersion': string;
    'requestId': string;
    'context'?: string;
    'data': PrepareAFungibleTokenTransferFromAddressEVMRData;
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
