"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveAndSyncNewChangeAddressesUTXORData = void 0;
var DeriveAndSyncNewChangeAddressesUTXORData = (function () {
    function DeriveAndSyncNewChangeAddressesUTXORData() {
    }
    DeriveAndSyncNewChangeAddressesUTXORData.getAttributeTypeMap = function () {
        return DeriveAndSyncNewChangeAddressesUTXORData.attributeTypeMap;
    };
    DeriveAndSyncNewChangeAddressesUTXORData.discriminator = undefined;
    DeriveAndSyncNewChangeAddressesUTXORData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<DeriveAndSyncNewChangeAddressesUTXORI>"
        }
    ];
    return DeriveAndSyncNewChangeAddressesUTXORData;
}());
exports.DeriveAndSyncNewChangeAddressesUTXORData = DeriveAndSyncNewChangeAddressesUTXORData;
//# sourceMappingURL=deriveAndSyncNewChangeAddressesUTXORData.js.map