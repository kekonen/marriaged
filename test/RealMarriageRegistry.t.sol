// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/RealMarriageRegistry.sol";

contract RealMarriageRegistryTest is Test {
    RealMarriageRegistry public marriageRegistry;
    address public owner;
    address public zkPassportVerifier;
    
    bytes32 public constant SPOUSE1_NULLIFIER = keccak256("spouse1");
    bytes32 public constant SPOUSE2_NULLIFIER = keccak256("spouse2");
    bytes32 public constant PROOF1_HASH = keccak256("proof1");
    bytes32 public constant PROOF2_HASH = keccak256("proof2");

    function setUp() public {
        owner = address(this);
        zkPassportVerifier = address(0x1111111111111111111111111111111111111111);
        marriageRegistry = new RealMarriageRegistry(zkPassportVerifier);
    }

    function testCreateMarriage() public {
        bytes32 marriageId = keccak256(abi.encodePacked(SPOUSE1_NULLIFIER, SPOUSE2_NULLIFIER, block.timestamp));
        
        marriageRegistry.createMarriage(
            marriageId,
            SPOUSE1_NULLIFIER,
            SPOUSE2_NULLIFIER,
            PROOF1_HASH,
            PROOF2_HASH
        );

        (bool isMarried, bytes32 returnedMarriageId, uint256 marriageDate) = 
            marriageRegistry.getMarriageStatusByNullifier(SPOUSE1_NULLIFIER);
            
        assertTrue(isMarried);
        assertEq(returnedMarriageId, marriageId);
        assertEq(marriageDate, block.timestamp);
    }

    function testCannotMarryTwice() public {
        bytes32 marriageId1 = keccak256(abi.encodePacked(SPOUSE1_NULLIFIER, SPOUSE2_NULLIFIER, block.timestamp));
        
        marriageRegistry.createMarriage(
            marriageId1,
            SPOUSE1_NULLIFIER,
            SPOUSE2_NULLIFIER,
            PROOF1_HASH,
            PROOF2_HASH
        );

        bytes32 marriageId2 = keccak256(abi.encodePacked(SPOUSE1_NULLIFIER, keccak256("spouse3"), block.timestamp));
        
        vm.expectRevert(RealMarriageRegistry.NullifierAlreadyUsed.selector);
        marriageRegistry.createMarriage(
            marriageId2,
            SPOUSE1_NULLIFIER,
            keccak256("spouse3"),
            PROOF1_HASH,
            keccak256("proof3")
        );
    }

    function testRequestDivorce() public {
        bytes32 marriageId = keccak256(abi.encodePacked(SPOUSE1_NULLIFIER, SPOUSE2_NULLIFIER, block.timestamp));
        
        marriageRegistry.createMarriage(
            marriageId,
            SPOUSE1_NULLIFIER,
            SPOUSE2_NULLIFIER,
            PROOF1_HASH,
            PROOF2_HASH
        );

        marriageRegistry.requestDivorce(marriageId, SPOUSE1_NULLIFIER);

        (bool isMarried,,) = marriageRegistry.getMarriageStatusByNullifier(SPOUSE1_NULLIFIER);
        assertFalse(isMarried);
    }
}