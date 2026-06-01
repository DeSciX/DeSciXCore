export declare class AddressCoinsTransactionUnconfirmedDataItem {
    'blockchain': string;
    'network': string;
    'address': string;
    'transactionId': string;
    'amount': string;
    'unit': AddressCoinsTransactionUnconfirmedDataItem.UnitEnum;
    'direction': AddressCoinsTransactionUnconfirmedDataItem.DirectionEnum;
    'firstSeenInMempoolTimestamp': number;
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
export declare namespace AddressCoinsTransactionUnconfirmedDataItem {
    enum UnitEnum {
        Btc,
        Satoshi,
        Wei,
        Gwei,
        Eth,
        Doge,
        Dash,
        Etc,
        Xrp,
        Zil,
        Matic
    }
    enum DirectionEnum {
        Incoming,
        Outgoing
    }
}
