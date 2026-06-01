"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsAndEachConfirmationE409 = void 0;
var NewConfirmedInternalTransactionsAndEachConfirmationE409 = (function () {
    function NewConfirmedInternalTransactionsAndEachConfirmationE409() {
    }
    NewConfirmedInternalTransactionsAndEachConfirmationE409.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsAndEachConfirmationE409.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsAndEachConfirmationE409.discriminator = undefined;
    NewConfirmedInternalTransactionsAndEachConfirmationE409.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return NewConfirmedInternalTransactionsAndEachConfirmationE409;
}());
exports.NewConfirmedInternalTransactionsAndEachConfirmationE409 = NewConfirmedInternalTransactionsAndEachConfirmationE409;
//# sourceMappingURL=newConfirmedInternalTransactionsAndEachConfirmationE409.js.map