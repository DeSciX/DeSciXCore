"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewChangeAddressesUTXOE400 = void 0;
var DeriveAndSyncNewChangeAddressesUTXOE400 = (function () {
    function DeriveAndSyncNewChangeAddressesUTXOE400() {
    }
    DeriveAndSyncNewChangeAddressesUTXOE400.getAttributeTypeMap = function () {
        return DeriveAndSyncNewChangeAddressesUTXOE400.attributeTypeMap;
    };
    DeriveAndSyncNewChangeAddressesUTXOE400.discriminator = undefined;
    DeriveAndSyncNewChangeAddressesUTXOE400.attributeTypeMap = [
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
    return DeriveAndSyncNewChangeAddressesUTXOE400;
}());
exports.DeriveAndSyncNewChangeAddressesUTXOE400 = DeriveAndSyncNewChangeAddressesUTXOE400;
//# sourceMappingURL=deriveAndSyncNewChangeAddressesUTXOE400.js.map