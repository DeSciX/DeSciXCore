"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressSyncStatus = void 0;
var AddressSyncStatus = (function () {
    function AddressSyncStatus() {
    }
    AddressSyncStatus.getAttributeTypeMap = function () {
        return AddressSyncStatus.attributeTypeMap;
    };
    AddressSyncStatus.discriminator = undefined;
    AddressSyncStatus.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        },
        {
            "name": "idempotencyKey",
            "baseName": "idempotencyKey",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "AddressSyncStatusData"
        }
    ];
    return AddressSyncStatus;
}());
exports.AddressSyncStatus = AddressSyncStatus;
//# sourceMappingURL=addressSyncStatus.js.map