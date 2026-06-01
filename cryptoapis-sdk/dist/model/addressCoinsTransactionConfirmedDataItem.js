"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCoinsTransactionConfirmedDataItem = void 0;
var AddressCoinsTransactionConfirmedDataItem = (function () {
    function AddressCoinsTransactionConfirmedDataItem() {
    }
    AddressCoinsTransactionConfirmedDataItem.getAttributeTypeMap = function () {
        return AddressCoinsTransactionConfirmedDataItem.attributeTypeMap;
    };
    AddressCoinsTransactionConfirmedDataItem.discriminator = undefined;
    AddressCoinsTransactionConfirmedDataItem.attributeTypeMap = [
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
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "AddressCoinsTransactionConfirmedDataItemMinedInBlock"
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
            "type": "string"
        },
        {
            "name": "direction",
            "baseName": "direction",
            "type": "AddressCoinsTransactionConfirmedDataItem.DirectionEnum"
        }
    ];
    return AddressCoinsTransactionConfirmedDataItem;
}());
exports.AddressCoinsTransactionConfirmedDataItem = AddressCoinsTransactionConfirmedDataItem;
(function (AddressCoinsTransactionConfirmedDataItem) {
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum[DirectionEnum["Incoming"] = 'incoming'] = "Incoming";
        DirectionEnum[DirectionEnum["Outgoing"] = 'outgoing'] = "Outgoing";
    })(DirectionEnum = AddressCoinsTransactionConfirmedDataItem.DirectionEnum || (AddressCoinsTransactionConfirmedDataItem.DirectionEnum = {}));
})(AddressCoinsTransactionConfirmedDataItem || (exports.AddressCoinsTransactionConfirmedDataItem = AddressCoinsTransactionConfirmedDataItem = {}));
//# sourceMappingURL=addressCoinsTransactionConfirmedDataItem.js.map