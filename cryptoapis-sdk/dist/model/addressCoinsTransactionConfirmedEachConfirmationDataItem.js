"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCoinsTransactionConfirmedEachConfirmationDataItem = void 0;
var AddressCoinsTransactionConfirmedEachConfirmationDataItem = (function () {
    function AddressCoinsTransactionConfirmedEachConfirmationDataItem() {
    }
    AddressCoinsTransactionConfirmedEachConfirmationDataItem.getAttributeTypeMap = function () {
        return AddressCoinsTransactionConfirmedEachConfirmationDataItem.attributeTypeMap;
    };
    AddressCoinsTransactionConfirmedEachConfirmationDataItem.discriminator = undefined;
    AddressCoinsTransactionConfirmedEachConfirmationDataItem.attributeTypeMap = [
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
            "type": "AddressCoinsTransactionConfirmedEachConfirmationDataItemMinedInBlock"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "currentConfirmations",
            "baseName": "currentConfirmations",
            "type": "number"
        },
        {
            "name": "targetConfirmations",
            "baseName": "targetConfirmations",
            "type": "number"
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
            "type": "AddressCoinsTransactionConfirmedEachConfirmationDataItem.DirectionEnum"
        }
    ];
    return AddressCoinsTransactionConfirmedEachConfirmationDataItem;
}());
exports.AddressCoinsTransactionConfirmedEachConfirmationDataItem = AddressCoinsTransactionConfirmedEachConfirmationDataItem;
(function (AddressCoinsTransactionConfirmedEachConfirmationDataItem) {
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum[DirectionEnum["Incoming"] = 'incoming'] = "Incoming";
        DirectionEnum[DirectionEnum["Outgoing"] = 'outgoing'] = "Outgoing";
    })(DirectionEnum = AddressCoinsTransactionConfirmedEachConfirmationDataItem.DirectionEnum || (AddressCoinsTransactionConfirmedEachConfirmationDataItem.DirectionEnum = {}));
})(AddressCoinsTransactionConfirmedEachConfirmationDataItem || (exports.AddressCoinsTransactionConfirmedEachConfirmationDataItem = AddressCoinsTransactionConfirmedEachConfirmationDataItem = {}));
//# sourceMappingURL=addressCoinsTransactionConfirmedEachConfirmationDataItem.js.map