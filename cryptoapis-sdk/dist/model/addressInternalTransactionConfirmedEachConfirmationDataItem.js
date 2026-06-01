"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressInternalTransactionConfirmedEachConfirmationDataItem = void 0;
var AddressInternalTransactionConfirmedEachConfirmationDataItem = (function () {
    function AddressInternalTransactionConfirmedEachConfirmationDataItem() {
    }
    AddressInternalTransactionConfirmedEachConfirmationDataItem.getAttributeTypeMap = function () {
        return AddressInternalTransactionConfirmedEachConfirmationDataItem.attributeTypeMap;
    };
    AddressInternalTransactionConfirmedEachConfirmationDataItem.discriminator = undefined;
    AddressInternalTransactionConfirmedEachConfirmationDataItem.attributeTypeMap = [
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
            "type": "AddressInternalTransactionConfirmedEachConfirmationDataItemMinedInBlock"
        },
        {
            "name": "parentTransactionId",
            "baseName": "parentTransactionId",
            "type": "string"
        },
        {
            "name": "operationId",
            "baseName": "operationId",
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
            "type": "AddressInternalTransactionConfirmedEachConfirmationDataItem.DirectionEnum"
        }
    ];
    return AddressInternalTransactionConfirmedEachConfirmationDataItem;
}());
exports.AddressInternalTransactionConfirmedEachConfirmationDataItem = AddressInternalTransactionConfirmedEachConfirmationDataItem;
(function (AddressInternalTransactionConfirmedEachConfirmationDataItem) {
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum[DirectionEnum["Incoming"] = 'incoming'] = "Incoming";
        DirectionEnum[DirectionEnum["Outgoing"] = 'outgoing'] = "Outgoing";
    })(DirectionEnum = AddressInternalTransactionConfirmedEachConfirmationDataItem.DirectionEnum || (AddressInternalTransactionConfirmedEachConfirmationDataItem.DirectionEnum = {}));
})(AddressInternalTransactionConfirmedEachConfirmationDataItem || (exports.AddressInternalTransactionConfirmedEachConfirmationDataItem = AddressInternalTransactionConfirmedEachConfirmationDataItem = {}));
//# sourceMappingURL=addressInternalTransactionConfirmedEachConfirmationDataItem.js.map