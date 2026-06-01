"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsE401 = void 0;
var NewConfirmedInternalTransactionsE401 = (function () {
    function NewConfirmedInternalTransactionsE401() {
    }
    NewConfirmedInternalTransactionsE401.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsE401.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsE401.discriminator = undefined;
    NewConfirmedInternalTransactionsE401.attributeTypeMap = [
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
    return NewConfirmedInternalTransactionsE401;
}());
exports.NewConfirmedInternalTransactionsE401 = NewConfirmedInternalTransactionsE401;
//# sourceMappingURL=newConfirmedInternalTransactionsE401.js.map