// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RealMarriageRegistry.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // For now, we'll use a placeholder zkPassport verifier address
        // In production, this would be the actual zkPassport verifier contract
        address zkPassportVerifier = address(0x1111111111111111111111111111111111111111);
        
        RealMarriageRegistry marriageRegistry = new RealMarriageRegistry(zkPassportVerifier);
        
        console.log("MarriageRegistry deployed to:", address(marriageRegistry));
        console.log("Owner:", marriageRegistry.owner());
        console.log("zkPassport Verifier:", marriageRegistry.zkPassportVerifier());

        vm.stopBroadcast();
    }
}