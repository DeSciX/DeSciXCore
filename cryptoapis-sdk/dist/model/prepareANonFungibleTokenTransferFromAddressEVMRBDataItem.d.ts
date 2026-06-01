import { PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee } from './prepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee';
export declare class PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem {
    'contract': string;
    'nonce'?: string;
    'recipient': string;
    'sender': string;
    'tokenId': string;
    'fee': PrepareANonFungibleTokenTransferFromAddressEVMRBDataItemFee;
    'type'?: PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem.TypeEnum;
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
export declare namespace PrepareANonFungibleTokenTransferFromAddressEVMRBDataItem {
    enum TypeEnum {
        LegacyTransaction,
        AccessListTransaction,
        GasFeeMarketTransaction
    }
}
