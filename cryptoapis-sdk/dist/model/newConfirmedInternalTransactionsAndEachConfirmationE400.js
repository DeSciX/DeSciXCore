"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsAndEachConfirmationE400 = void 0;
var NewConfirmedInternalTransactionsAndEachConfirmationE400 = (function () {
    function NewConfirmedInternalTransactionsAndEachConfirmationE400() {
    }
    NewConfirmedInternalTransactionsAndEachConfirmationE400.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsAndEachConfirmationE400.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsAndEachConfirmationE400.discriminator = undefined;
    NewConfirmedInternalTransactionsAndEachConfirmationE400.attributeTypeMap = [
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
    return NewConfirmedInternalTransactionsAndEachConfirmationE400;
}());
exports.NewConfirmedInternalTransactionsAndEachConfirmationE400 = NewConfirmedInternalTransactionsAndEachConfirmationE400;
//# sourceMappingURL=newConfirmedInternalTransactionsAndEachConfirmationE400.js.map