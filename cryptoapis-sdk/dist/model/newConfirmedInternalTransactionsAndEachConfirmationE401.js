"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsAndEachConfirmationE401 = void 0;
var NewConfirmedInternalTransactionsAndEachConfirmationE401 = (function () {
    function NewConfirmedInternalTransactionsAndEachConfirmationE401() {
    }
    NewConfirmedInternalTransactionsAndEachConfirmationE401.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsAndEachConfirmationE401.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsAndEachConfirmationE401.discriminator = undefined;
    NewConfirmedInternalTransactionsAndEachConfirmationE401.attributeTypeMap = [
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
    return NewConfirmedInternalTransactionsAndEachConfirmationE401;
}());
exports.NewConfirmedInternalTransactionsAndEachConfirmationE401 = NewConfirmedInternalTransactionsAndEachConfirmationE401;
//# sourceMappingURL=newConfirmedInternalTransactionsAndEachConfirmationE401.js.map