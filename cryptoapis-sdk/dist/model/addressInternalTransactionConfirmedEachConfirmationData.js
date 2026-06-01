"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressInternalTransactionConfirmedEachConfirmationData = void 0;
var AddressInternalTransactionConfirmedEachConfirmationData = (function () {
    function AddressInternalTransactionConfirmedEachConfirmationData() {
    }
    AddressInternalTransactionConfirmedEachConfirmationData.getAttributeTypeMap = function () {
        return AddressInternalTransactionConfirmedEachConfirmationData.attributeTypeMap;
    };
    AddressInternalTransactionConfirmedEachConfirmationData.discriminator = undefined;
    AddressInternalTransactionConfirmedEachConfirmationData.attributeTypeMap = [
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
            "type": "AddressInternalTransactionConfirmedEachConfirmationDataItem"
        }
    ];
    return AddressInternalTransactionConfirmedEachConfirmationData;
}());
exports.AddressInternalTransactionConfirmedEachConfirmationData = AddressInternalTransactionConfirmedEachConfirmationData;
//# sourceMappingURL=addressInternalTransactionConfirmedEachConfirmationData.js.map