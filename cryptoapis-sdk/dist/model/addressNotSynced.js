"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressNotSynced = void 0;
var AddressNotSynced = (function () {
    function AddressNotSynced() {
    }
    AddressNotSynced.getAttributeTypeMap = function () {
        return AddressNotSynced.attributeTypeMap;
    };
    AddressNotSynced.discriminator = undefined;
    AddressNotSynced.attributeTypeMap = [
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
    return AddressNotSynced;
}());
exports.AddressNotSynced = AddressNotSynced;
//# sourceMappingURL=addressNotSynced.js.map