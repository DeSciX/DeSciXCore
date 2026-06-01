import { PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee } from './prepareAFungibleTokenTransferFromAddressEVMRBDataItemFee';
export declare class PrepareAFungibleTokenTransferFromAddressEVMRBDataItem {
    'amount': string;
    'contract': string;
    'nonce'?: string;
    'recipient': string;
    'sender': string;
    'fee': PrepareAFungibleTokenTransferFromAddressEVMRBDataItemFee;
    'type'?: PrepareAFungibleTokenTransferFromAddressEVMRBDataItem.TypeEnum;
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
export declare namespace PrepareAFungibleTokenTransferFromAddressEVMRBDataItem {
    enum TypeEnum {
        LegacyTransaction,
        AccessListTransaction,
        GasFeeMarketTransaction
    }
}
