"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCoinsTransactionUnconfirmedDataItem = void 0;
var AddressCoinsTransactionUnconfirmedDataItem = (function () {
    function AddressCoinsTransactionUnconfirmedDataItem() {
    }
    AddressCoinsTransactionUnconfirmedDataItem.getAttributeTypeMap = function () {
        return AddressCoinsTransactionUnconfirmedDataItem.attributeTypeMap;
    };
    AddressCoinsTransactionUnconfirmedDataItem.discriminator = undefined;
    AddressCoinsTransactionUnconfirmedDataItem.attributeTypeMap = [
        {
            "name": "blockchain",
            "baseName": "blockchain",
            "type": "string"
        },
        {
            "name": "network",
            "baseName": "network",
            "type": "string"
        },
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "AddressCoinsTransactionUnconfirmedDataItem.UnitEnum"
        },
        {
            "name": "direction",
            "baseName": "direction",
            "type": "AddressCoinsTransactionUnconfirmedDataItem.DirectionEnum"
        },
        {
            "name": "firstSeenInMempoolTimestamp",
            "baseName": "firstSeenInMempoolTimestamp",
            "type": "number"
        }
    ];
    return AddressCoinsTransactionUnconfirmedDataItem;
}());
exports.AddressCoinsTransactionUnconfirmedDataItem = AddressCoinsTransactionUnconfirmedDataItem;
(function (AddressCoinsTransactionUnconfirmedDataItem) {
    var UnitEnum;
    (function (UnitEnum) {
        UnitEnum[UnitEnum["Btc"] = 'btc'] = "Btc";
        UnitEnum[UnitEnum["Satoshi"] = 'satoshi'] = "Satoshi";
        UnitEnum[UnitEnum["Wei"] = 'wei'] = "Wei";
        UnitEnum[UnitEnum["Gwei"] = 'gwei'] = "Gwei";
        UnitEnum[UnitEnum["Eth"] = 'eth'] = "Eth";
        UnitEnum[UnitEnum["Doge"] = 'doge'] = "Doge";
        UnitEnum[UnitEnum["Dash"] = 'dash'] = "Dash";
        UnitEnum[UnitEnum["Etc"] = 'etc'] = "Etc";
        UnitEnum[UnitEnum["Xrp"] = 'xrp'] = "Xrp";
        UnitEnum[UnitEnum["Zil"] = 'zil'] = "Zil";
        UnitEnum[UnitEnum["Matic"] = 'matic'] = "Matic";
    })(UnitEnum = AddressCoinsTransactionUnconfirmedDataItem.UnitEnum || (AddressCoinsTransactionUnconfirmedDataItem.UnitEnum = {}));
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum[DirectionEnum["Incoming"] = 'incoming'] = "Incoming";
        DirectionEnum[DirectionEnum["Outgoing"] = 'outgoing'] = "Outgoing";
    })(DirectionEnum = AddressCoinsTransactionUnconfirmedDataItem.DirectionEnum || (AddressCoinsTransactionUnconfirmedDataItem.DirectionEnum = {}));
})(AddressCoinsTransactionUnconfirmedDataItem || (exports.AddressCoinsTransactionUnconfirmedDataItem = AddressCoinsTransactionUnconfirmedDataItem = {}));
//# sourceMappingURL=addressCoinsTransactionUnconfirmedDataItem.js.map