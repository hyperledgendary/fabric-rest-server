'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
export default interface FabricConfig {
    aslocalhost: boolean;
    walletpath: string;
    identityLabel: string;
    gateway: string;
    contract: string;
    network: string;
}
