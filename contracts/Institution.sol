// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./Certification.sol";

contract Institution {
    // State Variables
    address public owner;

    // Mappings
    mapping(address => Institute) private institutes; // Institutes Mapping
    mapping(address => Degree[]) private instituteDegrees; // Degrees Mapping
    mapping(address => Department[]) private instituteDepartments; // Departments Mapping

    // Events
    event instituteAdded(string _instituteName);

    constructor() {
        owner = msg.sender;
    }

    struct Degree {
        string degree_name;
    }

    struct Department {
        string department_name;
    }

    struct Institute {
        string institute_name;
        string institute_address;
        string institute_acronym;
        string institute_link;
    }

    function stringToBytes32(
        string memory source
    ) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }

    function addInstitute(
        address _address,
        string memory _institute_name,
        string memory _institute_address,
        string memory _institute_acronym,
        string memory _institute_link,
        Degree[] memory _institute_degrees,
        Department[] memory _institute_departments
    ) public returns (bool) {
        // Only owner can add institute
        require(
            msg.sender == owner,
            "Caller must be the owner - only owner can add an institute"
        );
        bytes memory tempEmptyStringNameTest = bytes(
            institutes[_address].institute_name
        );
        require(
            tempEmptyStringNameTest.length == 0,
            "Institute with token already exists"
        );
        require(
            _institute_degrees.length > 0,
            "Atleast one degree must be added"
        );
        require(
            _institute_departments.length > 0,
            "Atleast one department must be added"
        );
        institutes[_address] = Institute(
            _institute_name,
            _institute_address,
            _institute_acronym,
            _institute_link
        );

        for (uint256 i = 0; i < _institute_degrees.length; i++) {
            instituteDegrees[_address].push(_institute_degrees[i]);
        }

        for (uint256 i = 0; i < _institute_departments.length; i++) {
            instituteDepartments[_address].push(_institute_departments[i]);
        }

        emit instituteAdded(_institute_name);
        return true;
    }

    // Called by Institutions
    function getInstituteData()
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            Degree[] memory,
            Department[] memory
        )
    {
        Institute memory temp = institutes[msg.sender];
        bytes memory tempEmptyStringNameTest = bytes(temp.institute_name);
        require(
            tempEmptyStringNameTest.length > 0,
            "Institute account does not exist!"
        );
        return (
            temp.institute_name,
            temp.institute_address,
            temp.institute_acronym,
            temp.institute_link,
            instituteDegrees[msg.sender],
            instituteDepartments[msg.sender]
        );
    }

    // Called by Smart Contracts
    function getInstituteData(
        address _address
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            Degree[] memory,
            Department[] memory
        )
    {
        require(
            Certification(msg.sender).owner() == owner,
            "Incorrect smart contract & authorizations!"
        );
        Institute memory temp = institutes[_address];
        bytes memory tempEmptyStringNameTest = bytes(temp.institute_name);
        require(
            tempEmptyStringNameTest.length > 0,
            "Institute does not exist!"
        );
        return (
            temp.institute_name,
            temp.institute_address,
            temp.institute_acronym,
            temp.institute_link,
            instituteDegrees[_address],
            instituteDepartments[_address]
        );
    }

    function checkInstitutePermission(
        address _address
    ) public view returns (bool) {
        Institute memory temp = institutes[_address];
        bytes memory tempEmptyStringNameTest = bytes(temp.institute_name);
        if (tempEmptyStringNameTest.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    function updateInstituteName(string memory _newName) public {
        require(
            bytes(institutes[msg.sender].institute_name).length > 0,
            "Institute not found"
        );
        institutes[msg.sender].institute_name = _newName;
    }
}
