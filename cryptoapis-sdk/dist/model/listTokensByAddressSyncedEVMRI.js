"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSyncedEVMRI = void 0;
var ListTokensByAddressSyncedEVMRI = (function () {
    function ListTokensByAddressSyncedEVMRI() {
    }
    ListTokensByAddressSyncedEVMRI.getAttributeTypeMap = function () {
        return ListTokensByAddressSyncedEVMRI.attributeTypeMap;
    };
    ListTokensByAddressSyncedEVMRI.discriminator = undefined;
    ListTokensByAddressSyncedEVMRI.attributeTypeMap = [
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        },
        {
            "name": "symbol",
            "baseName": "symbol",
            "type": "string"
        },
        {
            "name": "contractAddress",
            "baseName": "contractAddress",
            "type": "string"
        },
        {
            "name": "fungibleValues",
            "baseName": "fungibleValues",
            "type": "ListTokensByAddressSyncedEVMRIFungibleValues"
        }
    ];
    return ListTokensByAddressSyncedEVMRI;
}());
exports.ListTokensByAddressSyncedEVMRI = ListTokensByAddressSyncedEVMRI;
//# sourceMappingURL=listTokensByAddressSyncedEVMRI.js.map