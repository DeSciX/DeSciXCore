"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAddressRB = void 0;
var SyncAddressRB = (function () {
    function SyncAddressRB() {
    }
    SyncAddressRB.getAttributeTypeMap = function () {
        return SyncAddressRB.attributeTypeMap;
    };
    SyncAddressRB.discriminator = undefined;
    SyncAddressRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "SyncAddressRBData"
        }
    ];
    return SyncAddressRB;
}());
exports.SyncAddressRB = SyncAddressRB;
//# sourceMappingURL=syncAddressRB.js.map