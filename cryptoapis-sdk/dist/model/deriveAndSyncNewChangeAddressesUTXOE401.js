"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewChangeAddressesUTXOE401 = void 0;
var DeriveAndSyncNewChangeAddressesUTXOE401 = (function () {
    function DeriveAndSyncNewChangeAddressesUTXOE401() {
    }
    DeriveAndSyncNewChangeAddressesUTXOE401.getAttributeTypeMap = function () {
        return DeriveAndSyncNewChangeAddressesUTXOE401.attributeTypeMap;
    };
    DeriveAndSyncNewChangeAddressesUTXOE401.discriminator = undefined;
    DeriveAndSyncNewChangeAddressesUTXOE401.attributeTypeMap = [
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
    return DeriveAndSyncNewChangeAddressesUTXOE401;
}());
exports.DeriveAndSyncNewChangeAddressesUTXOE401 = DeriveAndSyncNewChangeAddressesUTXOE401;
//# sourceMappingURL=deriveAndSyncNewChangeAddressesUTXOE401.js.map