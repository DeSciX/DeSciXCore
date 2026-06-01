"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressInternalTransactionConfirmedDataItem = void 0;
var AddressInternalTransactionConfirmedDataItem = (function () {
    function AddressInternalTransactionConfirmedDataItem() {
    }
    AddressInternalTransactionConfirmedDataItem.getAttributeTypeMap = function () {
        return AddressInternalTransactionConfirmedDataItem.attributeTypeMap;
    };
    AddressInternalTransactionConfirmedDataItem.discriminator = undefined;
    AddressInternalTransactionConfirmedDataItem.attributeTypeMap = [
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
            "type": "AddressInternalTransactionConfirmedDataItemMinedInBlock"
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
            "type": "AddressInternalTransactionConfirmedDataItem.DirectionEnum"
        }
    ];
    return AddressInternalTransactionConfirmedDataItem;
}());
exports.AddressInternalTransactionConfirmedDataItem = AddressInternalTransactionConfirmedDataItem;
(function (AddressInternalTransactionConfirmedDataItem) {
    var DirectionEnum;
    (function (DirectionEnum) {
        DirectionEnum[DirectionEnum["Incoming"] = 'incoming'] = "Incoming";
        DirectionEnum[DirectionEnum["Outgoing"] = 'outgoing'] = "Outgoing";
    })(DirectionEnum = AddressInternalTransactionConfirmedDataItem.DirectionEnum || (AddressInternalTransactionConfirmedDataItem.DirectionEnum = {}));
})(AddressInternalTransactionConfirmedDataItem || (exports.AddressInternalTransactionConfirmedDataItem = AddressInternalTransactionConfirmedDataItem = {}));
//# sourceMappingURL=addressInternalTransactionConfirmedDataItem.js.map