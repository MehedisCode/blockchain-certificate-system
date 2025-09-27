// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./Certification.sol";

contract Institution {
    address public owner;

    mapping(address => Institute) private institutes;
    mapping(address => Degree[]) private instituteDegrees;
    mapping(address => Department[]) private instituteDepartments;

    event instituteAdded(string _instituteName);

    // ✨ NEW events for modify page UX
    event DegreesAdded(address indexed institute, uint256 count);
    event DegreeUpdated(address indexed institute, uint256 index, string newName);
    event DegreeRemoved(address indexed institute, uint256 index);
    event DegreesCleared(address indexed institute);

    event DepartmentsAdded(address indexed institute, uint256 count);
    event DepartmentUpdated(address indexed institute, uint256 index, string newName);
    event DepartmentRemoved(address indexed institute, uint256 index);
    event DepartmentsCleared(address indexed institute);

    constructor() {
        owner = msg.sender;
    }

    struct Degree { string degree_name; }
    struct Department { string department_name; }
    struct Institute {
        string institute_name;
        string institute_address;
        string institute_acronym;
        string institute_link;
    }

    // 🔒 modifier: only the institute wallet itself
    modifier onlyThisInstitute() {
        require(bytes(institutes[msg.sender].institute_name).length > 0, "Institute not found");
        _;
    }

    function stringToBytes32(string memory source) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) return 0x0;
        assembly { result := mload(add(source, 32)) }
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
        require(msg.sender == owner, "Caller must be the owner - only owner can add an institute");
        bytes memory tempEmptyStringNameTest = bytes(institutes[_address].institute_name);
        require(tempEmptyStringNameTest.length == 0, "Institute with token already exists");
        require(_institute_degrees.length > 0, "Atleast one degree must be added");
        require(_institute_departments.length > 0, "Atleast one department must be added");

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

    // ---------------------------
    // 🔧 INSTITUTE-SELF FUNCTIONS
    // ---------------------------

    // Add many degrees (from your Modify page)
    function addDegrees(string[] memory names) public onlyThisInstitute {
        for (uint256 i = 0; i < names.length; i++) {
            instituteDegrees[msg.sender].push(Degree(names[i]));
        }
        emit DegreesAdded(msg.sender, names.length);
    }

    // Update a degree name at index (keeps order)
    function updateDegree(uint256 index, string memory newName) public onlyThisInstitute {
        require(index < instituteDegrees[msg.sender].length, "Invalid index");
        instituteDegrees[msg.sender][index].degree_name = newName;
        emit DegreeUpdated(msg.sender, index, newName);
    }

    // Remove a degree by index (keeps order; O(n) shift—fine for short lists)
    function removeDegree(uint256 index) public onlyThisInstitute {
        uint256 len = instituteDegrees[msg.sender].length;
        require(index < len, "Invalid index");
        for (uint256 i = index; i < len - 1; i++) {
            instituteDegrees[msg.sender][i] = instituteDegrees[msg.sender][i + 1];
        }
        instituteDegrees[msg.sender].pop();
        emit DegreeRemoved(msg.sender, index);
    }

    // Clear all degrees
    function clearDegrees() public onlyThisInstitute {
        delete instituteDegrees[msg.sender];
        emit DegreesCleared(msg.sender);
    }

    // Add many departments
    function addDepartments(string[] memory names) public onlyThisInstitute {
        for (uint256 i = 0; i < names.length; i++) {
            instituteDepartments[msg.sender].push(Department(names[i]));
        }
        emit DepartmentsAdded(msg.sender, names.length);
    }

    // Update one department
    function updateDepartment(uint256 index, string memory newName) public onlyThisInstitute {
        require(index < instituteDepartments[msg.sender].length, "Invalid index");
        instituteDepartments[msg.sender][index].department_name = newName;
        emit DepartmentUpdated(msg.sender, index, newName);
    }

    // Remove by index (keeps order)
    function removeDepartment(uint256 index) public onlyThisInstitute {
        uint256 len = instituteDepartments[msg.sender].length;
        require(index < len, "Invalid index");
        for (uint256 i = index; i < len - 1; i++) {
            instituteDepartments[msg.sender][i] = instituteDepartments[msg.sender][i + 1];
        }
        instituteDepartments[msg.sender].pop();
        emit DepartmentRemoved(msg.sender, index);
    }

    // Clear all departments
    function clearDepartments() public onlyThisInstitute {
        delete instituteDepartments[msg.sender];
        emit DepartmentsCleared(msg.sender);
    }

    // ---------------------------

    // Called by Institutions (self)
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
        require(tempEmptyStringNameTest.length > 0, "Institute account does not exist!");
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
    function getInstituteData(address _address)
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
        require(Certification(msg.sender).owner() == owner, "Incorrect smart contract & authorizations!");
        Institute memory temp = institutes[_address];
        bytes memory tempEmptyStringNameTest = bytes(temp.institute_name);
        require(tempEmptyStringNameTest.length > 0, "Institute does not exist!");
        return (
            temp.institute_name,
            temp.institute_address,
            temp.institute_acronym,
            temp.institute_link,
            instituteDegrees[_address],
            instituteDepartments[_address]
        );
    }

    function checkInstitutePermission(address _address) public view returns (bool) {
        Institute memory temp = institutes[_address];
        return bytes(temp.institute_name).length > 0;
    }

    function updateInstituteName(string memory _newName) public onlyThisInstitute {
        institutes[msg.sender].institute_name = _newName;
    }
    function updateInstituteAddress(string memory _newAddress) public {
        require(bytes(institutes[msg.sender].institute_name).length > 0, "Institute not found");
        institutes[msg.sender].institute_address = _newAddress;
    }
    function updateInstituteAcronym(string memory _newAcronym) public {
        require(bytes(institutes[msg.sender].institute_name).length > 0, "Institute not found");
        institutes[msg.sender].institute_acronym = _newAcronym;
    }
    function updateInstituteLink(string memory _newLink) public {
        require(bytes(institutes[msg.sender].institute_name).length > 0, "Institute not found");
        institutes[msg.sender].institute_link = _newLink;
    }
}
