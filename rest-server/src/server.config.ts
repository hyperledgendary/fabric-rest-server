'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
import FabricConfig from './fabricproxy.config';

export default interface Config {
    localFile: string;
    outputFile: string;
    fabric: FabricConfig;
    port: number;
}
