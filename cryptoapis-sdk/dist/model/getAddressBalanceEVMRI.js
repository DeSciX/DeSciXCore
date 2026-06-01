"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceEVMRI = void 0;
var GetAddressBalanceEVMRI = (function () {
    function GetAddressBalanceEVMRI() {
    }
    GetAddressBalanceEVMRI.getAttributeTypeMap = function () {
        return GetAddressBalanceEVMRI.attributeTypeMap;
    };
    GetAddressBalanceEVMRI.discriminator = undefined;
    GetAddressBalanceEVMRI.attributeTypeMap = [
        {
            "name": "confirmedBalance",
            "baseName": "confirmedBalance",
            "type": "GetAddressBalanceEVMRIConfirmedBalance"
        }
    ];
    return GetAddressBalanceEVMRI;
}());
exports.GetAddressBalanceEVMRI = GetAddressBalanceEVMRI;
//# sourceMappingURL=getAddressBalanceEVMRI.js.map