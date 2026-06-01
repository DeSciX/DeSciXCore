"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressInternalTransactionConfirmedData = void 0;
var AddressInternalTransactionConfirmedData = (function () {
    function AddressInternalTransactionConfirmedData() {
    }
    AddressInternalTransactionConfirmedData.getAttributeTypeMap = function () {
        return AddressInternalTransactionConfirmedData.attributeTypeMap;
    };
    AddressInternalTransactionConfirmedData.discriminator = undefined;
    AddressInternalTransactionConfirmedData.attributeTypeMap = [
        {
            "name": "product",
            "baseName": "product",
            "type": "string"
        },
        {
            "name": "event",
            "baseName": "event",
            "type": "string"
        },
        {
            "name": "item",
            "baseName": "item",
            "type": "AddressInternalTransactionConfirmedDataItem"
        }
    ];
    return AddressInternalTransactionConfirmedData;
}());
exports.AddressInternalTransactionConfirmedData = AddressInternalTransactionConfirmedData;
//# sourceMappingURL=addressInternalTransactionConfirmedData.js.map